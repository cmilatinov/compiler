global main

section .text

               ; fn main
main:          push      rbp
               mov       rbp, rsp
               sub       rsp, 17

               ; t1 = - 2
               xor       rdi, rdi
               mov       edi, 2
               neg       edi

               ; t2 = 6 + t1
               ; registers: [ di = t1 ]
               xor       rsi, rsi
               mov       esi, 6
               add       esi, edi

               ; t3 = 3 / 2
               ; registers: [ di = t1, si = t2 ]
               xor       rax, rax
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, 3
               xor       rdi, rdi
               mov       edi, 2
               idiv      edi

               ; t4 = t3 * 3
               ; registers: [ si = t2, di = 2, a = t3 ]
               mov       edx, eax
               xor       rax, rax
               mov       ecx, edx
               mov       eax, ecx
               xor       rdx, rdx
               mov       edx, 3
               imul      edx

               ; t5 = t4 % 2
               ; registers: [ si = t2, di = 2, c = t3, d = 3, a = t4 ]
               mov       ecx, eax
               xor       rax, rax
               xor       rdx, rdx
               mov       eax, ecx
               idiv      edi

               ; t6 = t2 - t5
               ; registers: [ si = t2, di = 2, c = t4, a = t5 ]
               sub       esi, eax

               ; a = t6
               ; registers: [ di = 2, c = t4, a = t5, si = t6 ]
               mov       dword [rbp - 4], esi

               ; t7 = false && true
               ; registers: [ di = 2, c = t4, a = t5, si = t6 ]
               xor       rsi, rsi
               mov       sil, 0
               and       sil, 1

               ; t8 = true || t7
               ; registers: [ di = 2, c = t4, a = t5, si = t7 ]
               xor       rcx, rcx
               mov       cl, 1
               or        cl, sil

               ; t9 = type() t8
               ; registers: [ di = 2, a = t5, si = t7, c = t8 ]

               ; t10 = t9 + 3
               ; registers: [ di = 2, a = t5, si = t7, c = t9 ]
               add       ecx, 3

               ; b = t10
               ; registers: [ di = 2, a = t5, si = t7, c = t10 ]
               mov       dword [rbp - 8], ecx

               ; t11 = - 1
               ; registers: [ di = 2, a = t5, si = t7, c = t10 ]
               xor       rsi, rsi
               mov       esi, 1
               neg       esi

               ; t12 = t11 * 2
               ; registers: [ di = 2, a = t5, c = t10, si = t11 ]
               xor       rax, rax
               mov       eax, esi
               imul      edi

               ; t13 = ~ t12
               ; registers: [ di = 2, c = t10, si = t11, a = t12 ]
               not       eax

               ; t14 = 4 / 2
               ; registers: [ di = 2, c = t10, si = t11, a = t13 ]
               mov       esi, eax
               xor       rax, rax
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, 4
               idiv      edi

               ; t15 = t13 + t14
               ; registers: [ di = 2, c = t10, si = t13, a = t14 ]
               add       esi, eax

               ; c = t15
               ; registers: [ di = 2, c = t10, a = t14, si = t15 ]
               mov       dword [rbp - 12], esi

               ; t16 = type() 2300
               ; registers: [ di = 2, c = t10, a = t14, si = t15 ]
               xor       rsi, rsi
               mov       esi, 2300
               test      esi, esi
               mov       esi, 0
               setne     sil

               ; t17 = ! t16
               ; registers: [ di = 2, c = t10, a = t14, si = t16 ]
               test      sil, sil
               mov       sil, 0
               sete      sil

               ; t18 = ! t17
               ; registers: [ di = 2, c = t10, a = t14, si = t17 ]
               test      sil, sil
               mov       sil, 0
               sete      sil

               ; d = t18
               ; registers: [ di = 2, c = t10, a = t14, si = t18 ]
               mov       byte [rbp - 13], sil

               ; t19 = 3 + 23
               ; registers: [ di = 2, c = t10, a = t14, si = t18 ]
               xor       rsi, rsi
               mov       esi, 3
               add       esi, 23

               ; t20 = 2 ^ t19
               ; registers: [ di = 2, c = t10, a = t14, si = t19 ]
               xor       edi, esi

               ; t21 = t20 * 2
               ; registers: [ c = t10, a = t14, si = t19, di = t20 ]
               xor       rax, rax
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, 2
               imul      esi

               ; t22 = t21 / 7
               ; registers: [ c = t10, di = t20, si = 2, a = t21 ]
               mov       edi, eax
               xor       rax, rax
               xor       rdx, rdx
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, 7
               idiv      esi

               ; e = t22
               ; registers: [ c = t10, di = t21, si = 7, a = t22 ]
               mov       dword [rbp - 17], eax

               ; t23 = b * c
               ; registers: [ c = t10, di = t21, si = 7, a = t22 ]
               xor       rax, rax
               mov       eax, dword [rbp - 8]
               mov       edi, dword [rbp - 12]
               imul      edi

               ; t24 = type() d
               ; registers: [ c = t10, si = 7, di = c, a = t23 ]
               mov       dword [rbp - 12], edi
               mov       dil, byte [rbp - 13]

               ; t25 = t23 - t24
               ; registers: [ c = t10, si = 7, a = t23, di = t24 ]
               sub       eax, edi

               ; t26 = a * t25
               ; registers: [ c = t10, si = 7, di = t24, a = t25 ]
               mov       edi, eax
               xor       rax, rax
               mov       eax, dword [rbp - 4]
               imul      edi

               ; t27 = t26 + e
               ; registers: [ c = t10, si = 7, di = t25, a = t26 ]
               mov       edi, dword [rbp - 17]
               add       eax, edi

               ; return t27
               ; registers: [ c = t10, si = 7, di = e, a = t27 ]
               mov       dword [rbp - 17], edi
               mov       edi, eax
               mov       eax, edi
               add       rsp, 17
               pop       rbp
               ret       

               ; endfn main
               ; registers: [ c = t10, si = 7, di = t27, a = t27 ]
               add       rsp, 17
               pop       rbp
               ret       


