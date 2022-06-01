import { ASTNode } from '../lib/ast/ast-node';
import { SymbolTable, SymbolTableEntry } from '../lib/symbol-table';
import { LabelGenerator } from './label-generator';
import { Register, RegisterAllocator } from './register-allocator';
import { ASTVisitorBase } from '../lib/ast/ast-visitor';

import * as ASTUtils from '../ast/utils';
import * as SemanticUtils from '../semantic-analyzer/utils';
import * as Utils from './utils';

export interface Address {
    type: 'register' | 'stack' | 'stackTop' | 'absolute';
    register?: Register;
    stackOffset?: number;
    stackSizeToClear?: number;
    size?: number;
}

export interface IntermediateType {
    typeEntry: SymbolTableEntry;
    address: Address;
    stackSizeToClear?: number;
}

export class CodeGenerator extends ASTVisitorBase {

    private readonly _ast: ASTNode;
    private readonly _globalTable: SymbolTable;
    private readonly _labelGenerator: LabelGenerator;
    private readonly _registerAllocator: RegisterAllocator;
    private readonly _generateCode: (str: string) => void;

    private _currentTable: SymbolTable;

    constructor(ast: ASTNode, symbolTable: SymbolTable, generateCode: (str: string) => void = str => process.stdout.write(str)) {
        super();
        this._ast = ast;
        this._globalTable = this._currentTable = symbolTable;
        this._labelGenerator = new LabelGenerator();
        this._registerAllocator = new RegisterAllocator();
        this._generateCode = generateCode;
        this.allocateSymbolMemory(this._globalTable);
    }

    private allocateSymbolMemory(symbolTable: SymbolTable) {
        // Preorder visit
        let offset = 0;
        const parentEntry = symbolTable.getParentEntry();
        const extraStackSpace = 8; // RBP + Return Address
        if (parentEntry?.type === 'class') {
            // Start offset
            const baseEntries = parentEntry.inheritanceList.map(b => symbolTable.lookup(b));
            offset = baseEntries.map(e => this.computeClassSize(e))
                .reduce((sum, size) => sum + size, 0);

            // Base class offsets
            parentEntry.baseClassOffsets = [];
            let baseClassOffset = 0;
            baseEntries.forEach((e, i) => {
                parentEntry.baseClassOffsets[i] = baseClassOffset;
                baseClassOffset += e.size;
            });

            // Data members
            symbolTable.getEntries().filter(e => e.type === 'data')
                .forEach(entry => {
                    entry.size = CodeGenerator.getTypeSize(entry, symbolTable);
                    entry.offset = offset;
                    offset += entry.size;
                });

            // Class size
            parentEntry.size = this.computeClassSize(parentEntry);
        } else if (parentEntry?.type === 'function') {
            // Start offset
            // Need to account for old base pointer and return address,
            // hence +8 after func parameters
            // Each func parameter is ALWAYS of size 4 (passed by reference for compound types)
            offset = symbolTable.getEntries()
                .filter(e => e.type === 'parameter')
                .reduce((sum) => sum + 4, extraStackSpace);
            parentEntry.returnValueOffset = offset;
        }

        let firstLocal = true;
        for (const entry of symbolTable.getEntries()) {
            // noinspection FallThroughInSwitchStatementJS
            switch (entry.type) {
                case 'function':
                    entry.label = this._labelGenerator.generateLabel();
                case 'class':
                    this.allocateSymbolMemory(entry.symbolTable);
                    break;

                case 'parameter':
                    entry.size = CodeGenerator.getTypeSize(entry, symbolTable);
                    // Parameters always passed as pointers or primitive types
                    offset -= 4;
                    entry.offset = offset;
                    break;

                case 'local':
                    if (firstLocal) {
                        // Account for old base pointer and return address
                        offset -= extraStackSpace;
                        firstLocal = false;
                    }
                    entry.size = CodeGenerator.getTypeSize(entry, symbolTable);
                    offset -= entry.size;
                    entry.offset = offset;
                    break;
            }
        }
    }

    private computeClassSize(classEntry: SymbolTableEntry): number {
        const baseSize = classEntry.inheritanceList
            .map(c => classEntry.symbolTable.lookup(c))
            .map(e => this.computeClassSize(e))
            .reduce((sum, size) => sum + size, 0);
        return baseSize +
            classEntry.symbolTable
                .getEntries()
                .filter(e => e.type === 'data')
                .reduce((sum, entry) => sum + entry.size, 0);
    }

    private static getTypeSize(entry: SymbolTableEntry, parentTable: SymbolTable) {
        // Implicit this pointer
        if (entry.type === 'parameter' && entry.name === 'this') {
            return 4;
        }

        // Number of elements in array
        let numElements = 1;
        if (entry.arraySizes.length > 0) {
            numElements = entry.arraySizes.reduce((prod, size) => prod * size, 1);
        }

        // Need more space for pointers in multi-dimensional arrays
        let numPointers = 0;
        if (entry.arraySizes.length > 1) {
            for (let i = 0; i < entry.arraySizes.length - 1; i++) {
                let numDimensionPointers = 1;
                for (let j = 0; j < i + 1; j++) {
                    numDimensionPointers *= entry.arraySizes[j];
                }
                numPointers += numDimensionPointers;
            }
        }

        switch (entry.varType) {
            case 'float':
            case 'integer':
                return (4 * numPointers) + (4 * numElements);

            default:
                const type = parentTable.lookup(entry.varType);
                return (4 * numPointers) + (type.size * numElements);
        }
    }

    private getTypeSize(type: string, symbolTable: SymbolTable = this._currentTable): number {
        if (type === 'void')
            return 0;
        if (type === 'integer' || type === 'float')
            return 4;
        const typeEntry = symbolTable.lookup(type);
        return typeEntry.size;
    }

    protected getChildren(node: ASTNode): ASTNode[] {
        return ASTUtils.getNodeChildren(node);
    }

    protected visit(node: ASTNode) {
        switch (node.type) {
            case 'ImplDeclaration':
                this._currentTable = this._currentTable.lookup(node.name).symbolTable;
                break;

            case 'FunctionDefinition':
                this._currentTable = this._currentTable.lookup(node.name).symbolTable;
                return this.generateFunction(node);
        }
    }

    protected postVisit(node: ASTNode) {
        switch (node.type) {
            case 'ImplDeclaration':
            case 'FunctionDefinition':
                this._currentTable = this._currentTable.getParentTable() || this._globalTable;
                break;
        }
    }

    private generateFunction(node: ASTNode) {
        const functionEntry = this._currentTable.getParentEntry();
        this.line(`% Function '${SemanticUtils.stringifyFunction(node)}'`);

        // Stack frame
        const isMainEntry = functionEntry.name === 'main' && functionEntry.parameters.length === 0;
        if (isMainEntry) {
            this.line('% Initialize stack pointers');
            this.line(`% ${RegisterAllocator.RBP.name} - Base pointer, bottom of stack`);
            this.line(`% ${RegisterAllocator.RSP.name} - Stack pointer, top of stack`);
            this.instruction('entry', '');
            this.instruction('addi', `${RegisterAllocator.RBP.name},R0,topaddr`);
            this.instruction('add', `${RegisterAllocator.RSP.name},${RegisterAllocator.RBP.name},R0`);
        } else {
            // Push return address on stack
            this.line('% Push return address');
            this.push(RegisterAllocator.RET, functionEntry.label);
            this.line();

            // Push RBP, then Move RSP into RBP
            this.line('% Setup stack frame');
            this.push(RegisterAllocator.RBP);
            this.move(
                { type: 'register', register: RegisterAllocator.RSP },
                { type: 'register', register: RegisterAllocator.RBP }
            );
        }
        this.line();

        // Generate statements
        const statements = ASTUtils.getNodeChildren(node);
        statements.forEach(s => this.generateStatement(s));

        // Generate return if last statement is not a return
        const last = statements.pop();
        if (!last || last.type !== 'ReturnStatement') {
            this.generateReturnStatement();
        }
    }

    private generateStatement(node: ASTNode) {
        switch (node.type) {
            case 'ExpressionStatement':
                return this.generateExpressionStatement(node);
            case 'VariableDeclaration':
                return this.generateVariableDeclaration(node);
            case 'ReturnStatement':
                return this.generateReturnStatement(node);
            case 'IfStatement':
                return this.generateIfStatement(node);
            case 'WhileStatement':
                return this.generateWhileStatement(node);
            case 'ReadStatement':
                    return this.generateReadStatement(node);
            case 'WriteStatement':
                return this.generateWriteStatement(node);
            case 'BlockStatement':
                node.statements.forEach(s => this.generateStatement(s));
                return;
        }
    }

    private generateWriteStatement(node: ASTNode) {
        this.line('% Write statement');
        const register = this.loadInRegister(this.generateExpression(node.expression));
        this.instruction('putc', register.name);
        this.line();
        this._registerAllocator.freeRegister(register.id);
    }

    private generateReadStatement(node: ASTNode) {
        this.line('% Read statement');
        const address = this.generateExpression(node.expression);
        const register = this._registerAllocator.allocateRegister();
        this.instruction('add', `${register.name},R0,R0`);
        this.instruction('getc', register.name);
        this.move({ type: 'register', register }, address);
        this.line();
        this._registerAllocator.freeRegister(register.id);
        this.clearAddress(address);
    }

    private generateWhileStatement(node: ASTNode) {
        // Generate labels
        node.startLabel = this._labelGenerator.generateLabel();
        node.endLabel = this._labelGenerator.generateLabel();

        // Evaluate condition
        this.line('% While statement condition');
        this.instruction('nop', '', node.startLabel);
        const register = this.loadInRegister(this.generateExpression(node.condition));

        // Skip jump if condition is not zero
        this.instruction('bnz', `${register.name},8`);
        this._registerAllocator.freeRegister(register.id);

        // Jump to end of while statement
        this.jump(node.endLabel);
        this.line();

        // Generate while body statements
        this.generateStatement(node.body);

        // Jump back to start
        this.line('% While statement end');
        this.jump(node.startLabel);

        // Dummy labelled nop instruction to jump to
        this.instruction('nop', '', node.endLabel);
        this.line();
    }

    private generateIfStatement(node: ASTNode) {
        // Evaluate condition
        this.line('% If statement');
        const register = this.loadInRegister(this.generateExpression(node.condition));

        // Skip jump if condition is not zero
        this.instruction('bnz', `${register.name},8`);
        this._registerAllocator.freeRegister(register.id);

        // Generate else and end labels
        node.elseLabel = this._labelGenerator.generateLabel();
        node.endLabel = this._labelGenerator.generateLabel();

        // Jump to end of if statement
        this.jump(node.elseLabel);
        this.line();

        // Generate if body statements
        this.generateStatement(node.ifBody);

        // Jump to end
        this.line('% End of if body');
        this.jump(node.endLabel)
        this.instruction('nop', '', node.elseLabel);
        this.line();

        // Generate else body statements
        if (node.elseBody) {
            this.line('% Else body');
            this.generateStatement(node.elseBody);
        }

        // Dummy labelled nop instruction to jump to
        this.instruction('nop', '', node.endLabel);
        this.line();
    }

    private generateReturnStatement(node?: ASTNode) {
        this.line('% Return statement');
        const functionEntry = this._currentTable.getParentEntry();

        // Generate return expression
        if (node) {
            const address = this.generateExpression(node.expression);
            const returnAddress: Address = {
                type: 'stack',
                stackOffset: functionEntry.returnValueOffset,
                size: this.getTypeSize(functionEntry.returnType)
            };
            this.move(address, returnAddress);
            this.line();
            this.clearAddress(address);
        }

        // Clear local variables on stack
        const localStackSize = functionEntry.symbolTable
            .getEntries()
            .filter(e => e.type === 'local')
            .reduce((sum, e) => sum + e.size, 0);
        if (localStackSize > 0) {
            this.line('% Clear local stack');
            this.instruction('addi', `${RegisterAllocator.RSP.name},${RegisterAllocator.RSP.name},${localStackSize}`);
            this.line();
        }

        // Tear down stack frame
        this.line('% Tear down stack frame');
        this.pop(RegisterAllocator.RBP);
        this.line();

        // Pop return address
        const isMainEntry = functionEntry.name === 'main' && functionEntry.parameters.length === 0;
        const returnRegister = this._registerAllocator.allocateRegister();
        if (!isMainEntry) {
            this.line('% Pop return address');
            this.pop(returnRegister);
            this.line();
        }

        // Clear parameters on stack
        const paramStackSize = functionEntry.symbolTable
            .getEntries()
            .filter(e => e.type === 'parameter')
            .reduce((sum, e) => sum + e.size, 0);
        if (paramStackSize > 0) {
            this.line('% Clear parameter stack');
            this.instruction('addi', `${RegisterAllocator.RSP.name},${RegisterAllocator.RSP.name},${paramStackSize}`);
            this.line();
        }

        // Return to caller
        if (isMainEntry) {
            this.line('% End program');
            this.instruction('nop', '');
            this.instruction('j', '-4');
            this.instruction('hlt', '');
        } else {
            this.line('% Return to caller');
            this.instruction('jr', returnRegister.name);
        }
        this.line();
        this._registerAllocator.freeRegister(returnRegister.id);
    }

    private generateExpressionStatement(node: ASTNode) {
        const expression = node.expression;
        this.line(`% Expression statement`);
        const address = this.generateExpression(expression);
        this.clearAddress(address);
    }

    private generateExpression(node: ASTNode): Address {
        switch (node.type) {
            case 'FloatLiteral':
            case 'IntegerLiteral': {
                const register = this._registerAllocator.allocateRegister();
                this.instruction('addi', `${register.name},R0,${node.value}`);
                return { type: 'register', register };
            }
            case 'UnaryExpression': {
                const register = this.loadInRegister(this.generateExpression(node.expression));
                switch (node.operator) {
                    case '!':
                        this.instruction('not', `${register.name},${register.name}`);
                        break;
                    case '-':
                        this.instruction('muli', `${register.name},${register.name},-1`);
                        break;
                }
                return { type: 'register', register };
            }
            case 'BinaryExpression': {
                const left = this.loadInRegister(this.generateExpression(node.left));
                const right = this.loadInRegister(this.generateExpression(node.right));
                this.instruction(CodeGenerator.getBinaryInstruction(node.operator), `${left.name},${left.name},${right.name}`);
                this._registerAllocator.freeRegister(right.id);
                return { type: 'register', register: left };
            }
            case 'AssignmentExpression': {
                const left = this.generateExpression(node.left);
                const right = this.generateExpression(node.right);
                this.move(right, left);
                this.line();
                this.clearAddress(right);
                return left;
            }
            case 'IdentifierExpression':
            case 'MemberIndexExpression':
            case 'FunctionCallExpression': {
                const type = this.generateNestedIdentifierExpression(node);
                return { ...type.address, stackSizeToClear: type.stackSizeToClear };
            }
            case 'Index': {
                return this.generateExpression(node.expression);
            }
        }
    }

    private generateNestedIdentifierExpression(node: ASTNode): IntermediateType {
        let type = undefined;
        do {

            // Process node expression
            switch (node.type) {
                case 'IdentifierExpression':
                    type = this.generateIdentifierExpression(node, type);
                    break;
                case 'MemberIndexExpression':
                    type = this.generateMemberIndexExpression(node, type);
                    break;
                case 'FunctionCallExpression':
                    type = this.generateFunctionCallExpression(node, type);
                    break;
            }

            // Go to chained expression
            node = node.chainedExpression;

        } while (node);

        // Return final address
        return type;
    }

    private generateIdentifierExpression(node: ASTNode, previousType?: IntermediateType): IntermediateType {
        const varEntry = node.symbolEntry;
        if (previousType) {
            // Variable must be a data
            // Since this is a chained expression
            const dataOffset = this.getDataOffset(varEntry, previousType.typeEntry);
            switch (previousType.address.type) {
                case 'stack':
                case 'stackTop':
                    return {
                        typeEntry: this._currentTable.lookup(varEntry.varType),
                        address: {
                            type: previousType.address.type,
                            stackOffset: previousType.address.stackOffset + dataOffset,
                            size: varEntry.size
                        },
                        stackSizeToClear: previousType.stackSizeToClear
                    };
                case 'absolute':
                    const register = previousType.address.register;
                    this.instruction('addi', `${register},${register},${dataOffset}`);
                    return {
                        typeEntry: this._currentTable.lookup(varEntry.varType),
                        address: {
                            type: 'absolute',
                            register,
                            size: varEntry.size
                        },
                        stackSizeToClear: previousType.stackSizeToClear
                    };
            }
        } else {
            // Get variable or data by stack offset
            if (varEntry.type === 'data') {
                // Calculate offset from this pointer
                // Load memory address in register
                const thisEntry = this._currentTable.lookup('this');
                const register = this._registerAllocator.allocateRegister();
                this.instruction('lw', `${register.name},${thisEntry.offset}(${RegisterAllocator.RBP.name})`);
                this.instruction('addi', `${register.name},${register.name},${this.getDataOffset(varEntry)}`);

                // Return absolute address
                return {
                    typeEntry: this._currentTable.lookup(varEntry.varType),
                    address: {
                        type: 'absolute',
                        register,
                        size: varEntry.size
                    }
                };
            } else if (Utils.isReferenceType(varEntry)) {
                // Load memory address in register
                const register = this._registerAllocator.allocateRegister();
                this.instruction('lw', `${register.name},${varEntry.offset}(${RegisterAllocator.RBP.name})`);

                // Return absolute address
                return {
                    typeEntry: this._currentTable.lookup(varEntry.varType),
                    address: {
                        type: 'absolute',
                        register,
                        size: varEntry.size
                    }
                };
            }

            // Return stack offset directly
            return {
                typeEntry: this._currentTable.lookup(varEntry.varType),
                address: {
                    type: 'stack',
                    stackOffset: varEntry.offset,
                    size: varEntry.size
                }
            };
        }
    }

    private generateMemberIndexExpression(node: ASTNode, previousType?: IntermediateType): IntermediateType {
        const varEntry = node.symbolEntry;
        const addressRegister = this._registerAllocator.allocateRegister();
        if (previousType) {
            // Variable must be a data
            // Since this is a chained expression
            const dataOffset = this.getDataOffset(varEntry, previousType.typeEntry);
            switch (previousType.address.type) {
                case 'stack':
                case 'stackTop':
                    const stackRegister = previousType.address.type === 'stack' ?
                        RegisterAllocator.RBP :
                        RegisterAllocator.RSP;
                    this.instruction('addi', `${addressRegister.name},${stackRegister.name},${dataOffset}`);
                    break;
                case 'absolute':
                    const register = previousType.address.register;
                    this.instruction('add', `${addressRegister.name},${register.name},R0`);
                    this._registerAllocator.freeRegister(register.id);
                    break;
            }
        } else {
            // Get variable or data by stack offset or implicit this pointer
            if (varEntry.type === 'data') {
                const thisEntry = this._currentTable.lookup('this');
                this.instruction('lw', `${addressRegister.name},${thisEntry.offset}(${RegisterAllocator.RBP.name})`);
                this.instruction('addi', `${addressRegister.name},${addressRegister.name},${this.getDataOffset(varEntry)}`);
            } else if (Utils.isReferenceType(varEntry)) {
                this.instruction('lw', `${addressRegister.name},${varEntry.offset}(${RegisterAllocator.RBP.name})`);
            } else {
                const offset = varEntry.offset;
                this.instruction('addi', `${addressRegister.name},${RegisterAllocator.RBP.name},${offset}`);
            }
        }

        // Indexing
        let first = true;
        const typeSize = this.getTypeSize(varEntry.varType);
        for (const index of node.indices) {
            const indexRegister = this.loadInRegister(this.generateExpression(index));
            // De-referencing
            if (!first) {
                this.instruction('lw', `${addressRegister.name},0(${addressRegister.name})`);
            }
            // Add index
            this.instruction('muli', `${indexRegister.name},${indexRegister.name},${typeSize}`);
            this.instruction('add', `${addressRegister.name},${addressRegister.name},${indexRegister.name}`);
            this._registerAllocator.freeRegister(indexRegister.id);
            first = false;
        }

        // Return absolute address
        return {
            typeEntry: this._currentTable.lookup(varEntry.varType),
            address: {
                type: 'absolute',
                register: addressRegister,
                size: typeSize
            }
        };
    }

    private generateFunctionCallExpression(node: ASTNode, previousType?: IntermediateType): IntermediateType {
        const funcEntry = node.symbolEntry;

        // Allocate space for return value
        const returnTypeSize = this.getTypeSize(funcEntry.returnType);
        this.instruction('subi', `${RegisterAllocator.RSP.name},${RegisterAllocator.RSP.name},${returnTypeSize}`);

        // Push this pointer on stack if needed
        if (previousType) {
            switch (previousType.address.type) {
                case 'stack':
                case 'stackTop': {
                    const stackRegister = previousType.address.type === 'stack' ?
                        RegisterAllocator.RBP :
                        RegisterAllocator.RSP;
                    const register = this._registerAllocator.allocateRegister();
                    this.instruction('addi', `${register.name},${stackRegister.name},${previousType.address.stackOffset}`);
                    this.push(register);
                    this._registerAllocator.freeRegister(register.id);
                    break;
                }
                case 'absolute': {
                    const register = previousType.address.register;
                    this.push(register);
                    this._registerAllocator.freeRegister(register.id);
                    break;
                }
            }
        } else {
            const thisEntry = funcEntry.symbolTable.lookup('this');
            if (thisEntry) {
                const register = this._registerAllocator.allocateRegister();
                this.instruction('lw', `${register.name},${thisEntry.offset}(${RegisterAllocator.RBP.name})`);
                this.push(register);
                this._registerAllocator.freeRegister(register.id);
            }
        }

        // Push arguments on stack
        for (const arg of node.arguments) {
            const register = this.loadReferenceInRegister(this.generateExpression(arg));
            this.push(register);
            this._registerAllocator.freeRegister(register.id);
        }

        // Jump to subroutine
        const addressRegister = this._registerAllocator.allocateRegister();
        this.instruction('addi', `${addressRegister.name},R0,${funcEntry.label}`);
        this.instruction('jlr', `${RegisterAllocator.RET.name},${addressRegister.name}`);
        this._registerAllocator.freeRegister(addressRegister.id);

        // Result should be on top of stack when we return
        return {
            typeEntry: funcEntry,
            address: {
                type: 'stackTop',
                stackOffset: 0,
                size: returnTypeSize
            },
            stackSizeToClear: returnTypeSize
        };
    }

    private generateVariableDeclaration(node: ASTNode) {
        const varEntry = this._currentTable.lookup(node.name);
        this.line(`% let ${node.name}: ${SemanticUtils.stringifyType(node)};`);
        this.instruction('subi', `R15,R15,${varEntry.size}`);

        // Initialize pointers for multi-dimensional array types
        const arraySizes = varEntry.arraySizes;
        if (arraySizes.length > 1) {
            this.line();
            this.line('% Initialize multi-dimensional array pointers');
            const valueRegister = this._registerAllocator.allocateRegister();
            const destRegister = this._registerAllocator.allocateRegister();
            let count = 1;
            let startOffset = 0;
            for (let dim = 0; dim < arraySizes.length - 1; dim++) {
                count *= arraySizes[dim];
                for (let i = 0; i < count; i++) {
                    const ptrOffset = startOffset + count + i * arraySizes[dim + 1];
                    this.instruction('addi', `${valueRegister.name},${RegisterAllocator.RBP.name},${varEntry.offset + ptrOffset * 4}`);
                    this.instruction('addi', `${destRegister.name},${RegisterAllocator.RBP.name},${varEntry.offset + (startOffset + i) * 4}`);
                    this.instruction('sw', `0(${destRegister.name}),${valueRegister.name}`);
                }
                startOffset += count;
            }
            this._registerAllocator.freeRegister(valueRegister.id);
            this._registerAllocator.freeRegister(destRegister.id);
        }

        this.line();
    }

    private instruction(instruction: string, operands: string, label?: string) {
        this._generateCode((label || '').padEnd(15));
        this._generateCode(`${instruction.padEnd(7)}${operands}\n`);
    }

    private line(code?: string) {
        this._generateCode(`${code || ''}\n`);
    }

    private clearAddress(address: Address) {
        if (address.stackSizeToClear) {
            this.line('% Clear expression stack');
            this.instruction('addi', `${RegisterAllocator.RSP.name},${RegisterAllocator.RSP.name},${address.stackSizeToClear}`);
            this.line();
        }

        if (address.register) {
            this._registerAllocator.freeRegister(address.register.id);
        }
    }

    private push(register: Register, label?: string) {
        this.instruction('subi', 'R15,R15,4', label);
        this.instruction('sw', `0(R15),${register.name}`);
    }

    private pop(register: Register, label?: string) {
        this.instruction('lw', `${register.name},0(R15)`, label);
        this.instruction('addi', 'R15,R15,4');
    }

    private move(srcAddress: Address, dstAddress: Address) {
        switch (srcAddress.type) {
            case 'register':
                switch (dstAddress.type) {
                    case 'register':
                        this.instruction('add', `${dstAddress.register.name},${srcAddress.register.name},R0`);
                        break;
                    case 'absolute':
                        this.instruction('sw', `0(${dstAddress.register.name}),${srcAddress.register.name}`);
                        break;
                    case 'stack':
                        this.instruction('sw', `${dstAddress.stackOffset}(${RegisterAllocator.RBP.name}),${srcAddress.register.name}`);
                        break;
                }
                break;
            case 'absolute':
                switch (dstAddress.type) {
                    case 'register':
                        this.instruction('lw', `${dstAddress.register.name},0(${srcAddress.register.name})`);
                        break;
                    case 'absolute':
                        this.absoluteMove(srcAddress.register, dstAddress.register, dstAddress.size);
                        break;
                    case 'stack':
                        this.absoluteStackMove(srcAddress.register, dstAddress.stackOffset, dstAddress.size);
                        break;
                }
                break;
            case 'stack':
                switch (dstAddress.type) {
                    case 'register':
                        this.instruction('lw', `${dstAddress.register.name},${srcAddress.stackOffset}(${RegisterAllocator.RBP.name})`);
                        break;
                    case 'absolute':
                        this.stackAbsoluteMove(srcAddress.stackOffset, dstAddress.register, dstAddress.size);
                        break;
                    case 'stack':
                        this.stackMove(srcAddress.stackOffset, dstAddress.stackOffset, dstAddress.size);
                        break;
                }
                break;
            case 'stackTop':
                switch (dstAddress.type) {
                    case 'register':
                        this.instruction('lw', `${dstAddress.register.name},${srcAddress.stackOffset}(${RegisterAllocator.RSP.name})`);
                        break;
                    case 'absolute':
                        this.stackAbsoluteMove(srcAddress.stackOffset, dstAddress.register, dstAddress.size, RegisterAllocator.RSP);
                        break;
                    case 'stack':
                        this.stackMove(srcAddress.stackOffset, dstAddress.stackOffset, dstAddress.size, RegisterAllocator.RSP, RegisterAllocator.RBP);
                        break;
                }
                break;
        }
    }

    private jump(label: string) {
        const register = this._registerAllocator.allocateRegister();
        this.instruction('addi', `${register.name},R0,${label}`);
        this.instruction('jr', `${register.name}`);
        this._registerAllocator.freeRegister(register.id);
    }

    private stackMove(srcOffset: number, dstOffset: number, size: number, srcStackRegister: Register = RegisterAllocator.RBP, dstStackRegister: Register = RegisterAllocator.RBP) {
        const register = this._registerAllocator.allocateRegister();
        let index = 0;
        while (index < size) {
            this.instruction('lw', `${register.name},${srcOffset + index}(${srcStackRegister.name})`);
            this.instruction('sw', `${dstOffset + index}(${dstStackRegister.name}),${register.name}`);
            index += 4;
        }
        this._registerAllocator.freeRegister(register.id);
    }

    private stackAbsoluteMove(srcOffset: number, dstRegister: Register, size: number, stackRegister: Register = RegisterAllocator.RBP) {
        const register = this._registerAllocator.allocateRegister();
        let index = 0;
        while (index < size) {
            this.instruction('lw', `${register.name},${srcOffset + index}(${stackRegister.name})`);
            this.instruction('sw', `${index}(${dstRegister.name}),${register.name}`);
            index += 4;
        }
        this._registerAllocator.freeRegister(register.id);
    }

    private absoluteStackMove(srcRegister: Register, dstOffset: number, size: number, stackRegister: Register = RegisterAllocator.RBP) {
        const register = this._registerAllocator.allocateRegister();
        let index = 0;
        while (index < size) {
            this.instruction('lw', `${register.name},${index}(${srcRegister.name})`);
            this.instruction('sw', `${dstOffset + index}(${stackRegister.name}),${register.name}`);
            index += 4;
        }
        this._registerAllocator.freeRegister(register.id);
    }

    private absoluteMove(srcRegister: Register, dstRegister: Register, size: number) {
        const register = this._registerAllocator.allocateRegister();
        let index = 0;
        while (index < size) {
            this.instruction('lw', `${register.name},${index}(${srcRegister.name})`);
            this.instruction('sw', `${index}(${dstRegister.name}),${register.name}`);
            index += 4;
        }
        this._registerAllocator.freeRegister(register.id);
    }

    private loadInRegister(address: Address): Register {
        switch (address.type) {
            case 'register': {
                return address.register;
            }
            case 'absolute': {
                const register = this._registerAllocator.allocateRegister();
                this.instruction('lw', `${register.name},0(${address.register.name})`);
                this.clearAddress(address);
                return register;
            }
            case 'stack': {
                const register = this._registerAllocator.allocateRegister();
                this.instruction('lw', `${register.name},${address.stackOffset}(${RegisterAllocator.RBP.name})`);
                this.clearAddress(address);
                return register;
            }
            case 'stackTop': {
                const register = this._registerAllocator.allocateRegister();
                this.instruction('lw', `${register.name},${address.stackOffset}(${RegisterAllocator.RSP.name})`);
                this.clearAddress(address);
                return register;
            }
        }
    }

    private loadReferenceInRegister(address: Address): Register {
        switch (address.type) {
            case 'register': {
                return address.register;
            }
            case 'absolute': {
                return address.register;
            }
            case 'stack': {
                const register = this._registerAllocator.allocateRegister();
                this.instruction('add', `${register.name},${RegisterAllocator.RBP.name},${address.stackOffset}`)
                return register;
            }
            case 'stackTop': {
                const register = this._registerAllocator.allocateRegister();
                this.instruction('add', `${register.name},${RegisterAllocator.RSP.name},${address.stackOffset}`)
                return register;
            }
        }
    }

    private getCurrentClassEntry(symbolTable: SymbolTable = this._currentTable) {
        if (!symbolTable)
            return undefined;

        const parentEntry = symbolTable.getParentEntry();
        if (!parentEntry)
            return undefined;

        if (parentEntry.type === 'class')
            return parentEntry;

        return this.getCurrentClassEntry(symbolTable.getParentTable());
    }

    private getDataOffset(varEntry: SymbolTableEntry, classEntry?: SymbolTableEntry) {
        if (!classEntry)
            classEntry = this.getCurrentClassEntry();

        if (classEntry.symbolTable === varEntry.parentTable) {
            return varEntry.offset;
        }

        const inheritancePath = this.findInheritancePath(classEntry, varEntry.parentTable.getParentEntry());
        let offset = 0;
        for (let i = 0; i < inheritancePath.length - 1; i++) {
            const current = inheritancePath[i];
            const next = inheritancePath[i + 1];
            const offsetIndex = current.inheritanceList.findIndex(c => next.name === c);
            offset += current.baseClassOffsets[offsetIndex];
        }
        return varEntry.offset + offset;
    }

    private findInheritancePath(derivedClassEntry: SymbolTableEntry, baseClassEntry: SymbolTableEntry, inheritancePath: SymbolTableEntry[] = []) {
        inheritancePath.push(derivedClassEntry);

        if (derivedClassEntry === baseClassEntry)
            return inheritancePath;

        const baseClassEntries = derivedClassEntry.inheritanceList.map(b => derivedClassEntry.symbolTable.lookup(b));
        for (const entry of baseClassEntries) {
            const path = this.findInheritancePath(entry, baseClassEntry, inheritancePath);
            if (path)
                return path;
        }

        inheritancePath.pop();
    }

    private static getBinaryInstruction(operator: string) {
        switch (operator) {
            case '+':
                return 'add';
            case '-':
                return 'sub';
            case '*':
                return 'mul';
            case '/':
                return 'div';
            case '||':
                return 'or';
            case '&&':
                return 'and';
            case '==':
                return 'ceq';
            case '!=':
                return 'cne';
            case '>=':
                return 'cge';
            case '<=':
                return 'cle';
            case '>':
                return 'cgt';
            case '<':
                return 'clt';
        }
    }

}
