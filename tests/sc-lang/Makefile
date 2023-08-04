CC=gcc
NASM=nasm

BUILD_DIR = build
ASM_SRC = $(shell find $(BUILD_DIR) -name '*.asm')
ASM_OBJ = $(patsubst %.asm, %.o, $(ASM_SRC))
ASM_EXE = $(patsubst %.asm, %, $(ASM_SRC))

echo:
	@echo $(ASM_SRC)
	@echo $(ASM_OBJ)

all: $(ASM_EXE)

$(ASM_OBJ): %.o: %.asm
	$(NASM) -g -felf64 $< -o $@

$(ASM_EXE): %: %.o
	$(CC) -g -m64 -no-pie $< -o $@

clean:
	rm -rf $(BUILD_DIR)

