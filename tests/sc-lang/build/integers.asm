default rel

global main

section .text

               ; extern printf
               extern    printf

               ; fn main
main:          push      rbp
               mov       rbp, rsp
               sub       rsp, 32

               ; t1 = - 2
               xor       rdi, rdi
               mov       edi, dword [LC001]
               neg       edi

               ; t2 = 6 + t1
               ; registers: [ di = t1 ]
               xor       rsi, rsi
               mov       esi, dword [LC002]
               add       esi, edi

               ; t3 = 3 / 2
               ; registers: [ di = t1, si = t2 ]
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, dword [LC003]
               xor       rdi, rdi
               mov       edi, dword [LC001]
               idiv      edi

               ; t4 = t3 * 3
               ; registers: [ si = t2, di = 2, a = t3 ]
               mov       edx, eax
               xor       rax, rax
               mov       ecx, edx
               mov       eax, ecx
               xor       rdx, rdx
               mov       edx, dword [LC003]
               imul      edx

               ; t5 = t4 % 2
               ; registers: [ si = t2, di = 2, c = t3, d = 3, a = t4 ]
               mov       ecx, eax
               xor       rdx, rdx
               mov       eax, ecx
               idiv      edi

               ; t6 = t2 - t5
               ; registers: [ si = t2, di = 2, c = t4, d = t5 ]
               sub       esi, edx

               ; a = t6
               ; registers: [ di = 2, c = t4, d = t5, si = t6 ]
               mov       dword [rbp - 4], esi

               ; param "a = %d\n"
               ; registers: [ di = 2, c = t4, d = t5, si = t6 ]
               mov       rdi, LC004

               ; param a
               ; registers: [ c = t4, d = t5, si = t6, di = "a = %d\n" ]
               mov       esi, dword [rbp - 4]

               ; t7 = call printf
               ; registers: [ c = t4, d = t5, di = "a = %d\n", si = a ]
               mov       al, 0
               call      printf

               ; t8 = false && true
               ; registers: [ a = t7 ]
               xor       rdi, rdi
               mov       dil, byte [LC005]
               and       dil, 1

               ; t9 = true || t8
               ; registers: [ a = t7, di = t8 ]
               xor       rsi, rsi
               mov       sil, byte [LC006]
               or        sil, dil

               ; t10 = type() t9
               ; registers: [ a = t7, di = t8, si = t9 ]
               movsx     edi, sil

               ; t11 = t10 + 3
               ; registers: [ a = t7, di = t10 ]
               add       edi, 3

               ; b = t11
               ; registers: [ a = t7, di = t11 ]
               mov       dword [rbp - 8], edi

               ; param "b = %d\n"
               ; registers: [ a = t7, di = t11 ]
               mov       rdi, LC007

               ; param b
               ; registers: [ a = t7, di = "b = %d\n" ]
               mov       esi, dword [rbp - 8]

               ; t12 = call printf
               ; registers: [ a = t7, di = "b = %d\n", si = b ]
               mov       al, 0
               call      printf

               ; t13 = - 1
               ; registers: [ a = t12 ]
               xor       rdi, rdi
               mov       edi, dword [LC008]
               neg       edi

               ; t14 = t13 * 2
               ; registers: [ a = t12, di = t13 ]
               xor       rax, rax
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, dword [LC001]
               imul      esi

               ; t15 = ~ t14
               ; registers: [ di = t13, si = 2, a = t14 ]
               not       eax

               ; t16 = 4 / 2
               ; registers: [ di = t13, si = 2, a = t15 ]
               mov       edi, eax
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, dword [LC009]
               idiv      esi

               ; t17 = t15 + t16
               ; registers: [ si = 2, di = t15, a = t16 ]
               add       edi, eax

               ; c = t17
               ; registers: [ si = 2, a = t16, di = t17 ]
               mov       dword [rbp - 12], edi

               ; param "c = %d\n"
               ; registers: [ si = 2, a = t16, di = t17 ]
               mov       rdi, LC010

               ; param c
               ; registers: [ si = 2, a = t16, di = "c = %d\n" ]
               mov       esi, dword [rbp - 12]

               ; t18 = call printf
               ; registers: [ a = t16, di = "c = %d\n", si = c ]
               mov       al, 0
               call      printf

               ; t19 = type() 2300
               ; registers: [ a = t18 ]
               xor       rdi, rdi
               mov       edi, dword [LC011]
               test      edi, edi
               mov       edi, 0
               setne     dil

               ; t20 = ! t19
               ; registers: [ a = t18, di = t19 ]
               test      dil, dil
               mov       dil, 0
               sete      dil

               ; t21 = ! t20
               ; registers: [ a = t18, di = t20 ]
               test      dil, dil
               mov       dil, 0
               sete      dil

               ; t22 = type() t21
               ; registers: [ a = t18, di = t21 ]
               movsx     edi, dil

               ; d = t22
               ; registers: [ a = t18, di = t22 ]
               mov       dword [rbp - 16], edi

               ; param "d = %d\n"
               ; registers: [ a = t18, di = t22 ]
               mov       rdi, LC012

               ; param d
               ; registers: [ a = t18, di = "d = %d\n" ]
               mov       esi, dword [rbp - 16]

               ; t23 = call printf
               ; registers: [ a = t18, di = "d = %d\n", si = d ]
               mov       al, 0
               call      printf

               ; t24 = 3 + 23
               ; registers: [ a = t23 ]
               xor       rdi, rdi
               mov       edi, dword [LC003]
               add       edi, 23

               ; t25 = 2 ^ t24
               ; registers: [ a = t23, di = t24 ]
               xor       rsi, rsi
               mov       esi, dword [LC001]
               xor       esi, edi

               ; t26 = t25 * 2
               ; registers: [ a = t23, di = t24, si = t25 ]
               xor       rax, rax
               mov       eax, esi
               xor       rdi, rdi
               mov       edi, dword [LC001]
               imul      edi

               ; t27 = t26 / 7
               ; registers: [ si = t25, di = 2, a = t26 ]
               mov       edi, eax
               xor       rdx, rdx
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, dword [LC013]
               idiv      esi

               ; e = t27
               ; registers: [ di = t26, si = 7, a = t27 ]
               mov       dword [rbp - 20], eax

               ; param "e = %d\n"
               ; registers: [ di = t26, si = 7, a = t27 ]
               mov       rdi, LC014

               ; param e
               ; registers: [ si = 7, a = t27, di = "e = %d\n" ]
               mov       esi, dword [rbp - 20]

               ; t28 = call printf
               ; registers: [ a = t27, di = "e = %d\n", si = e ]
               mov       al, 0
               call      printf

               ; t29 = b * c
               ; registers: [ a = t28 ]
               xor       rax, rax
               mov       eax, dword [rbp - 8]
               mov       edi, dword [rbp - 12]
               imul      edi

               ; t30 = t29 - d
               ; registers: [ di = c, a = t29 ]
               mov       edi, dword [rbp - 16]
               sub       eax, edi

               ; t31 = a * t30
               ; registers: [ di = d, a = t30 ]
               mov       edi, eax
               xor       rax, rax
               mov       eax, dword [rbp - 4]
               imul      edi

               ; t32 = t31 + e
               ; registers: [ di = t30, a = t31 ]
               mov       edi, dword [rbp - 20]
               add       eax, edi

               ; f = t32
               ; registers: [ di = e, a = t32 ]
               mov       dword [rbp - 24], eax

               ; param "f = %d\n"
               ; registers: [ di = e, a = t32 ]
               mov       rdi, LC015

               ; param f
               ; registers: [ a = t32, di = "f = %d\n" ]
               mov       esi, dword [rbp - 24]

               ; t33 = call printf
               ; registers: [ a = t32, di = "f = %d\n", si = f ]
               mov       al, 0
               call      printf

               ; endfn main
               ; registers: [ a = t33 ]
               add       rsp, 32
               pop       rbp
               xor       rax, rax
               ret       




section .data

LC001:         dd        2
LC002:         dd        6
LC003:         dd        3
LC004:         db        `a = %d\n`, 0
LC005:         db        0
LC006:         db        1
LC007:         db        `b = %d\n`, 0
LC008:         dd        1
LC009:         dd        4
LC010:         db        `c = %d\n`, 0
LC011:         dd        2300
LC012:         db        `d = %d\n`, 0
LC013:         dd        7
LC014:         db        `e = %d\n`, 0
LC015:         db        `f = %d\n`, 0