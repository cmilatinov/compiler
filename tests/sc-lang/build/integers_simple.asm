default rel

global main

section .text

               ; extern printf
               extern    printf

               ; fn main
main:          push      rbp
               mov       rbp, rsp

               ; t2 = - 5
               xor       rdi, rdi
               mov       edi, dword [LC001]
               neg       edi

               ; t3 = - t2
               ; registers: [ di = t2 ]
               neg       edi

               ; param "%d\n"
               ; registers: [ di = t3 ]
               mov       esi, edi
               mov       rdi, LC002

               ; param t3
               ; registers: [ si = t3, di = "%d\n" ]

               ; t1 = call printf
               ; registers: [ si = t3, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t5 = 4 == 4
               ; registers: [ a = t1 ]
               xor       rdi, rdi
               mov       edi, dword [LC003]
               cmp       edi, edi
               mov       edi, 0
               sete      dil

               ; t6 = ! t5
               ; registers: [ a = t1, di = t5 ]
               test      dil, dil
               mov       dil, 0
               sete      dil

               ; t7 = 6 > 3
               ; registers: [ a = t1, di = t6 ]
               xor       rsi, rsi
               mov       esi, dword [LC004]
               cmp       esi, 3
               mov       esi, 0
               setg      sil

               ; t8 = t6 && t7
               ; registers: [ a = t1, di = t6, si = t7 ]
               and       dil, sil

               ; param "%d\n"
               ; registers: [ a = t1, si = t7, di = t8 ]
               mov       sil, dil
               mov       rdi, LC002

               ; param t8
               ; registers: [ a = t1, si = t8, di = "%d\n" ]

               ; t4 = call printf
               ; registers: [ a = t1, si = t8, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t10 = ~ 15
               ; registers: [ a = t4 ]
               xor       rdi, rdi
               mov       edi, dword [LC005]
               not       edi

               ; param "%d\n"
               ; registers: [ a = t4, di = t10 ]
               mov       esi, edi
               mov       rdi, LC002

               ; param t10
               ; registers: [ a = t4, si = t10, di = "%d\n" ]

               ; t9 = call printf
               ; registers: [ a = t4, si = t10, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t12 = 2 + 3
               ; registers: [ a = t9 ]
               xor       rdi, rdi
               mov       edi, dword [LC006]
               add       edi, 3

               ; t13 = 7 * t12
               ; registers: [ a = t9, di = t12 ]
               xor       rax, rax
               xor       rax, rax
               mov       eax, dword [LC007]
               imul      edi

               ; param "%d\n"
               ; registers: [ di = t12, a = t13 ]
               mov       rdi, LC002

               ; param t13
               ; registers: [ a = t13, di = "%d\n" ]
               mov       esi, eax

               ; t11 = call printf
               ; registers: [ a = t13, di = "%d\n", si = t13 ]
               mov       al, 0
               call      printf

               ; t15 = 10 % 3
               ; registers: [ a = t11 ]
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, dword [LC008]
               xor       rdi, rdi
               mov       edi, dword [LC009]
               idiv      edi

               ; param "%d\n"
               ; registers: [ di = 3, d = t15 ]
               mov       rdi, LC002

               ; param t15
               ; registers: [ d = t15, di = "%d\n" ]
               mov       esi, edx

               ; t14 = call printf
               ; registers: [ d = t15, di = "%d\n", si = t15 ]
               mov       al, 0
               call      printf

               ; t17 = 1 << 3
               ; registers: [ a = t14 ]
               xor       rdi, rdi
               mov       edi, dword [LC010]
               sal       edi, 3

               ; t18 = t17 - 1
               ; registers: [ a = t14, di = t17 ]
               sub       edi, 1

               ; param "%d\n"
               ; registers: [ a = t14, di = t18 ]
               mov       esi, edi
               mov       rdi, LC002

               ; param t18
               ; registers: [ a = t14, si = t18, di = "%d\n" ]

               ; t16 = call printf
               ; registers: [ a = t14, si = t18, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t20 = 12 >> 1
               ; registers: [ a = t16 ]
               xor       rdi, rdi
               mov       edi, dword [LC011]
               sar       edi, 1

               ; param "%d\n"
               ; registers: [ a = t16, di = t20 ]
               mov       esi, edi
               mov       rdi, LC002

               ; param t20
               ; registers: [ a = t16, si = t20, di = "%d\n" ]

               ; t19 = call printf
               ; registers: [ a = t16, si = t20, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t22 = false || true
               ; registers: [ a = t19 ]
               xor       rdi, rdi
               mov       dil, byte [LC012]
               or        dil, 1

               ; t23 = true && t22
               ; registers: [ a = t19, di = t22 ]
               xor       rsi, rsi
               mov       sil, byte [LC013]
               and       sil, dil

               ; param "%d\n"
               ; registers: [ a = t19, di = t22, si = t23 ]
               mov       rdi, LC002

               ; param t23
               ; registers: [ a = t19, si = t23, di = "%d\n" ]

               ; t21 = call printf
               ; registers: [ a = t19, si = t23, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t25 = - 2
               ; registers: [ a = t21 ]
               xor       rdi, rdi
               mov       edi, dword [LC006]
               neg       edi

               ; t26 = 10 / t25
               ; registers: [ a = t21, di = t25 ]
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, dword [LC008]
               idiv      edi

               ; param "%d\n"
               ; registers: [ di = t25, a = t26 ]
               mov       rdi, LC002

               ; param t26
               ; registers: [ a = t26, di = "%d\n" ]
               mov       esi, eax

               ; t24 = call printf
               ; registers: [ a = t26, di = "%d\n", si = t26 ]
               mov       al, 0
               call      printf

               ; t28 = 8 != 8
               ; registers: [ a = t24 ]
               xor       rdi, rdi
               mov       edi, dword [LC014]
               cmp       edi, edi
               mov       edi, 0
               setne     dil

               ; t29 = ! t28
               ; registers: [ a = t24, di = t28 ]
               test      dil, dil
               mov       dil, 0
               sete      dil

               ; t30 = 5 <= 4
               ; registers: [ a = t24, di = t29 ]
               xor       rsi, rsi
               mov       esi, dword [LC001]
               cmp       esi, 4
               mov       esi, 0
               setle     sil

               ; t31 = t29 || t30
               ; registers: [ a = t24, di = t29, si = t30 ]
               or        dil, sil

               ; param "%d\n"
               ; registers: [ a = t24, si = t30, di = t31 ]
               mov       sil, dil
               mov       rdi, LC002

               ; param t31
               ; registers: [ a = t24, si = t31, di = "%d\n" ]

               ; t27 = call printf
               ; registers: [ a = t24, si = t31, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t33 = 2 | 6
               ; registers: [ a = t27 ]
               xor       rdi, rdi
               mov       edi, dword [LC006]
               or        edi, 6

               ; param "%d\n"
               ; registers: [ a = t27, di = t33 ]
               mov       esi, edi
               mov       rdi, LC002

               ; param t33
               ; registers: [ a = t27, si = t33, di = "%d\n" ]

               ; t32 = call printf
               ; registers: [ a = t27, si = t33, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t35 = 3 ^ 9
               ; registers: [ a = t32 ]
               xor       rdi, rdi
               mov       edi, dword [LC009]
               xor       edi, 9

               ; param "%d\n"
               ; registers: [ a = t32, di = t35 ]
               mov       esi, edi
               mov       rdi, LC002

               ; param t35
               ; registers: [ a = t32, si = t35, di = "%d\n" ]

               ; t34 = call printf
               ; registers: [ a = t32, si = t35, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t37 = - 5
               ; registers: [ a = t34 ]
               xor       rdi, rdi
               mov       edi, dword [LC001]
               neg       edi

               ; t38 = - t37
               ; registers: [ a = t34, di = t37 ]
               neg       edi

               ; t39 = - t38
               ; registers: [ a = t34, di = t38 ]
               neg       edi

               ; param "%d\n"
               ; registers: [ a = t34, di = t39 ]
               mov       esi, edi
               mov       rdi, LC002

               ; param t39
               ; registers: [ a = t34, si = t39, di = "%d\n" ]

               ; t36 = call printf
               ; registers: [ a = t34, si = t39, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t41 = 2 + 3
               ; registers: [ a = t36 ]
               xor       rdi, rdi
               mov       edi, dword [LC006]
               add       edi, 3

               ; t42 = t41 * 4
               ; registers: [ a = t36, di = t41 ]
               xor       rax, rax
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, dword [LC003]
               imul      esi

               ; param "%d\n"
               ; registers: [ di = t41, si = 4, a = t42 ]
               mov       rdi, LC002

               ; param t42
               ; registers: [ si = 4, a = t42, di = "%d\n" ]
               mov       esi, eax

               ; t40 = call printf
               ; registers: [ a = t42, di = "%d\n", si = t42 ]
               mov       al, 0
               call      printf

               ; t44 = 7 > 5
               ; registers: [ a = t40 ]
               xor       rdi, rdi
               mov       edi, dword [LC007]
               cmp       edi, 5
               mov       edi, 0
               setg      dil

               ; t45 = 3 <= 3
               ; registers: [ a = t40, di = t44 ]
               xor       rsi, rsi
               mov       esi, dword [LC009]
               cmp       esi, esi
               mov       esi, 0
               setle     sil

               ; t46 = t44 && t45
               ; registers: [ a = t40, di = t44, si = t45 ]
               and       dil, sil

               ; param "%d\n"
               ; registers: [ a = t40, si = t45, di = t46 ]
               mov       sil, dil
               mov       rdi, LC002

               ; param t46
               ; registers: [ a = t40, si = t46, di = "%d\n" ]

               ; t43 = call printf
               ; registers: [ a = t40, si = t46, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t48 = false && true
               ; registers: [ a = t43 ]
               xor       rdi, rdi
               mov       dil, byte [LC012]
               and       dil, 1

               ; t49 = true || t48
               ; registers: [ a = t43, di = t48 ]
               xor       rsi, rsi
               mov       sil, byte [LC013]
               or        sil, dil

               ; param "%d\n"
               ; registers: [ a = t43, di = t48, si = t49 ]
               mov       rdi, LC002

               ; param t49
               ; registers: [ a = t43, si = t49, di = "%d\n" ]

               ; t47 = call printf
               ; registers: [ a = t43, si = t49, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t51 = 10 % 6
               ; registers: [ a = t47 ]
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, dword [LC008]
               xor       rdi, rdi
               mov       edi, dword [LC004]
               idiv      edi

               ; param "%d\n"
               ; registers: [ di = 6, d = t51 ]
               mov       rdi, LC002

               ; param t51
               ; registers: [ d = t51, di = "%d\n" ]
               mov       esi, edx

               ; t50 = call printf
               ; registers: [ d = t51, di = "%d\n", si = t51 ]
               mov       al, 0
               call      printf

               ; t53 = 5 == 5
               ; registers: [ a = t50 ]
               xor       rdi, rdi
               mov       edi, dword [LC001]
               cmp       edi, edi
               mov       edi, 0
               sete      dil

               ; t54 = 7 != 7
               ; registers: [ a = t50, di = t53 ]
               xor       rsi, rsi
               mov       esi, dword [LC007]
               cmp       esi, esi
               mov       esi, 0
               setne     sil

               ; t55 = ! t54
               ; registers: [ a = t50, di = t53, si = t54 ]
               test      sil, sil
               mov       sil, 0
               sete      sil

               ; t56 = t53 && t55
               ; registers: [ a = t50, di = t53, si = t55 ]
               and       dil, sil

               ; param "%d\n"
               ; registers: [ a = t50, si = t55, di = t56 ]
               mov       sil, dil
               mov       rdi, LC002

               ; param t56
               ; registers: [ a = t50, si = t56, di = "%d\n" ]

               ; t52 = call printf
               ; registers: [ a = t50, si = t56, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t58 = 15 & 6
               ; registers: [ a = t52 ]
               xor       rdi, rdi
               mov       edi, dword [LC005]
               and       edi, 6

               ; param "%d\n"
               ; registers: [ a = t52, di = t58 ]
               mov       esi, edi
               mov       rdi, LC002

               ; param t58
               ; registers: [ a = t52, si = t58, di = "%d\n" ]

               ; t57 = call printf
               ; registers: [ a = t52, si = t58, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t60 = - 4
               ; registers: [ a = t57 ]
               xor       rdi, rdi
               mov       edi, dword [LC003]
               neg       edi

               ; t61 = 7 * 3
               ; registers: [ a = t57, di = t60 ]
               xor       rax, rax
               xor       rax, rax
               mov       eax, dword [LC007]
               xor       rsi, rsi
               mov       esi, dword [LC009]
               imul      esi

               ; t62 = t60 + t61
               ; registers: [ di = t60, si = 3, a = t61 ]
               add       edi, eax

               ; param "%d\n"
               ; registers: [ si = 3, a = t61, di = t62 ]
               mov       esi, edi
               mov       rdi, LC002

               ; param t62
               ; registers: [ a = t61, si = t62, di = "%d\n" ]

               ; t59 = call printf
               ; registers: [ a = t61, si = t62, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; endfn main
               ; registers: [ a = t59 ]
               pop       rbp
               xor       rax, rax
               ret       




section .data

LC001:         dd        5
LC002:         db        `%d\n`, 0
LC003:         dd        4
LC004:         dd        6
LC005:         dd        15
LC006:         dd        2
LC007:         dd        7
LC008:         dd        10
LC009:         dd        3
LC010:         dd        1
LC011:         dd        12
LC012:         db        0
LC013:         db        1
LC014:         dd        8