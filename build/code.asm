DEFAULT REL

global main

section .text

               ; fn main
main:          push      rbp
               mov       rbp, rsp
               sub       rsp, 8

               ; t1 = 2 / 6
               xor       rax, rax
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, dword [LC001]
               xor       rdi, rdi
               mov       edi, dword [LC002]
               idiv      edi

               ; t2 = t1 * 3
               ; registers: [ di = 6, a = t1 ]
               mov       edi, eax
               xor       rax, rax
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, dword [LC003]
               imul      esi

               ; t3 = 1 + t2
               ; registers: [ di = t1, si = 3, a = t2 ]
               xor       rdi, rdi
               mov       edi, dword [LC004]
               add       edi, eax

               ; a = t3
               ; registers: [ si = 3, a = t2, di = t3 ]
               mov       dword [rbp - 4], edi

               ; t4 = type() a
               ; registers: [ si = 3, a = t2, di = t3 ]
               mov       edi, dword [rbp - 4]
               cvtsi2sd  edi, edi

               ; b = t4
               ; registers: [ si = 3, a = t2, di = t4 ]
               mov       dword [rbp - 8], edi

               ; return a
               ; registers: [ si = 3, a = t2, di = t4 ]
               mov       eax, dword [rbp - 4]
               add       rsp, 8
               pop       rbp
               ret       

               ; endfn main
               ; registers: [ si = 3, di = t4, a = a ]
               add       rsp, 8
               pop       rbp
               ret       




section .data

LC004:         dd        1
LC001:         dd        2
LC003:         dd        3
LC002:         dd        6