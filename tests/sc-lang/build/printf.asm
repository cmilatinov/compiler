default rel

global main

section .text

               ; extern printf
               extern    printf

               ; fn main
main:          push      rbp
               mov       rbp, rsp

               ; t2 = type() 1.0
               xorps     xmm0, xmm0
               movd      xmm0, dword [LC001]
               cvtss2sd  xmm0, xmm0

               ; param 'Hello World!\nMy name is %s %s %d %f'
               ; registers: [ mm0 = t2 ]
               mov       rdi, LC002

               ; param 'Cristian'
               ; registers: [ mm0 = t2, di = 'Hello World!\nMy name is %s %s %d %f' ]
               mov       rsi, LC003

               ; param 'Milatinov'
               ; registers: [ mm0 = t2, di = 'Hello World!\nMy name is %s %s %d %f', si = 'Cristian' ]
               mov       rdx, LC004

               ; param 23
               ; registers: [ mm0 = t2, di = 'Hello World!\nMy name is %s %s %d %f', si = 'Cristian', d = 'Milatinov' ]
               xor       rcx, rcx
               mov       ecx, dword [LC005]

               ; param t2
               ; registers: [ mm0 = t2, di = 'Hello World!\nMy name is %s %s %d %f', si = 'Cristian', d = 'Milatinov', c = 23 ]

               ; t1 = call printf
               ; registers: [ mm0 = t2, di = 'Hello World!\nMy name is %s %s %d %f', si = 'Cristian', d = 'Milatinov', c = 23 ]
               mov       al, 0
               call      printf

               ; endfn main
               ; registers: [ a = t1 ]
               pop       rbp
               xor       rax, rax
               ret       




section .data

LC001:         dd        1.00000
LC002:         db        `Hello World!\nMy name is %s %s %d %f`, 0
LC003:         db        `Cristian`, 0
LC004:         db        `Milatinov`, 0
LC005:         dd        23