default rel

global main

section .text

               ; extern printf
               extern    printf

               ; fn main
main:          push      rbp
               mov       rbp, rsp

               ; t2 = 2 + 3
               xor       rdi, rdi
               mov       edi, dword [LC001]
               add       edi, 3

               ; t3 = t2 * 4
               ; registers: [ di = t2 ]
               xor       rax, rax
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, dword [LC002]
               imul      esi

               ; t4 = 1 + 1
               ; registers: [ di = t2, si = 4, a = t3 ]
               xor       rdi, rdi
               mov       edi, dword [LC003]
               add       edi, edi

               ; t5 = t3 / t4
               ; registers: [ si = 4, a = t3, di = t4 ]
               mov       edx, eax
               mov       ecx, edx
               xor       rdx, rdx
               mov       eax, ecx
               idiv      edi

               ; param "%d\n"
               ; registers: [ si = 4, di = t4, c = t3, a = t5 ]
               mov       rdi, LC004

               ; param t5
               ; registers: [ si = 4, c = t3, a = t5, di = "%d\n" ]
               mov       esi, eax

               ; t1 = call printf
               ; registers: [ c = t3, a = t5, di = "%d\n", si = t5 ]
               mov       al, 0
               call      printf

               ; t7 = - 5
               ; registers: [ a = t1 ]
               xor       rdi, rdi
               mov       edi, dword [LC005]
               neg       edi

               ; t8 = t7 + 1
               ; registers: [ a = t1, di = t7 ]
               add       edi, 1

               ; t9 = - t8
               ; registers: [ a = t1, di = t8 ]
               neg       edi

               ; param "%d\n"
               ; registers: [ a = t1, di = t9 ]
               mov       esi, edi
               mov       rdi, LC004

               ; param t9
               ; registers: [ a = t1, si = t9, di = "%d\n" ]

               ; t6 = call printf
               ; registers: [ a = t1, si = t9, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t11 = 5 > 2
               ; registers: [ a = t6 ]
               xor       rdi, rdi
               mov       edi, dword [LC005]
               cmp       edi, 2
               mov       edi, 0
               setg      dil

               ; t12 = ! t11
               ; registers: [ a = t6, di = t11 ]
               test      dil, dil
               mov       dil, 0
               sete      dil

               ; t13 = 8 & 3
               ; registers: [ a = t6, di = t12 ]
               xor       rsi, rsi
               mov       esi, dword [LC006]
               and       esi, 3

               ; t14 = type() t13
               ; registers: [ a = t6, di = t12, si = t13 ]
               test      esi, esi
               mov       esi, 0
               setne     sil

               ; t15 = t12 || t14
               ; registers: [ a = t6, di = t12, si = t14 ]
               or        dil, sil

               ; param "%d\n"
               ; registers: [ a = t6, si = t14, di = t15 ]
               mov       sil, dil
               mov       rdi, LC004

               ; param t15
               ; registers: [ a = t6, si = t15, di = "%d\n" ]

               ; t10 = call printf
               ; registers: [ a = t6, si = t15, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t17 = 4 <= 5
               ; registers: [ a = t10 ]
               xor       rdi, rdi
               mov       edi, dword [LC002]
               cmp       edi, 5
               mov       edi, 0
               setle     dil

               ; t18 = 2 >= 2
               ; registers: [ a = t10, di = t17 ]
               xor       rsi, rsi
               mov       esi, dword [LC001]
               cmp       esi, esi
               mov       esi, 0
               setge     sil

               ; t19 = t17 && t18
               ; registers: [ a = t10, di = t17, si = t18 ]
               and       dil, sil

               ; param "%d\n"
               ; registers: [ a = t10, si = t18, di = t19 ]
               mov       sil, dil
               mov       rdi, LC004

               ; param t19
               ; registers: [ a = t10, si = t19, di = "%d\n" ]

               ; t16 = call printf
               ; registers: [ a = t10, si = t19, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t21 = 7 ^ 5
               ; registers: [ a = t16 ]
               xor       rdi, rdi
               mov       edi, dword [LC007]
               xor       edi, 5

               ; t22 = ~ t21
               ; registers: [ a = t16, di = t21 ]
               not       edi

               ; param "%d\n"
               ; registers: [ a = t16, di = t22 ]
               mov       esi, edi
               mov       rdi, LC004

               ; param t22
               ; registers: [ a = t16, si = t22, di = "%d\n" ]

               ; t20 = call printf
               ; registers: [ a = t16, si = t22, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t24 = true && false
               ; registers: [ a = t20 ]
               xor       rdi, rdi
               mov       dil, byte [LC008]
               and       dil, 0

               ; t25 = false || true
               ; registers: [ a = t20, di = t24 ]
               xor       rsi, rsi
               mov       sil, byte [LC009]
               or        sil, 1

               ; t26 = t24 || t25
               ; registers: [ a = t20, di = t24, si = t25 ]
               or        dil, sil

               ; param "%d\n"
               ; registers: [ a = t20, si = t25, di = t26 ]
               mov       sil, dil
               mov       rdi, LC004

               ; param t26
               ; registers: [ a = t20, si = t26, di = "%d\n" ]

               ; t23 = call printf
               ; registers: [ a = t20, si = t26, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t28 = 3 * 2
               ; registers: [ a = t23 ]
               xor       rax, rax
               xor       rax, rax
               mov       eax, dword [LC010]
               xor       rdi, rdi
               mov       edi, dword [LC001]
               imul      edi

               ; t29 = 8 % t28
               ; registers: [ di = 2, a = t28 ]
               mov       esi, eax
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, dword [LC006]
               idiv      esi

               ; param "%d\n"
               ; registers: [ di = 2, si = t28, d = t29 ]
               mov       rdi, LC004

               ; param t29
               ; registers: [ si = t28, d = t29, di = "%d\n" ]
               mov       esi, edx

               ; t27 = call printf
               ; registers: [ d = t29, di = "%d\n", si = t29 ]
               mov       al, 0
               call      printf

               ; t31 = 10 >> 2
               ; registers: [ a = t27 ]
               xor       rdi, rdi
               mov       edi, dword [LC011]
               sar       edi, 2

               ; t32 = t31 ^ 2
               ; registers: [ a = t27, di = t31 ]
               xor       edi, 2

               ; param "%d\n"
               ; registers: [ a = t27, di = t32 ]
               mov       esi, edi
               mov       rdi, LC004

               ; param t32
               ; registers: [ a = t27, si = t32, di = "%d\n" ]

               ; t30 = call printf
               ; registers: [ a = t27, si = t32, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t34 = - 1
               ; registers: [ a = t30 ]
               xor       rdi, rdi
               mov       edi, dword [LC003]
               neg       edi

               ; t35 = 5 - 7
               ; registers: [ a = t30, di = t34 ]
               xor       rsi, rsi
               mov       esi, dword [LC005]
               sub       esi, 7

               ; t36 = t34 * t35
               ; registers: [ a = t30, di = t34, si = t35 ]
               xor       rax, rax
               mov       eax, edi
               imul      esi

               ; t37 = 8 & 9
               ; registers: [ di = t34, si = t35, a = t36 ]
               xor       rdi, rdi
               mov       edi, dword [LC006]
               and       edi, 9

               ; t38 = t36 + t37
               ; registers: [ si = t35, a = t36, di = t37 ]
               add       eax, edi

               ; param "%d\n"
               ; registers: [ si = t35, di = t37, a = t38 ]
               mov       rdi, LC004

               ; param t38
               ; registers: [ si = t35, a = t38, di = "%d\n" ]
               mov       esi, eax

               ; t33 = call printf
               ; registers: [ a = t38, di = "%d\n", si = t38 ]
               mov       al, 0
               call      printf

               ; t40 = 6 == 7
               ; registers: [ a = t33 ]
               xor       rdi, rdi
               mov       edi, dword [LC012]
               cmp       edi, 7
               mov       edi, 0
               sete      dil

               ; t41 = ! t40
               ; registers: [ a = t33, di = t40 ]
               test      dil, dil
               mov       dil, 0
               sete      dil

               ; t42 = 2 | 3
               ; registers: [ a = t33, di = t41 ]
               xor       rsi, rsi
               mov       esi, dword [LC001]
               or        esi, 3

               ; t43 = t42 > 2
               ; registers: [ a = t33, di = t41, si = t42 ]
               cmp       esi, 2
               mov       esi, 0
               setg      sil

               ; t44 = t41 && t43
               ; registers: [ a = t33, di = t41, si = t43 ]
               and       dil, sil

               ; param "%d\n"
               ; registers: [ a = t33, si = t43, di = t44 ]
               mov       sil, dil
               mov       rdi, LC004

               ; param t44
               ; registers: [ a = t33, si = t44, di = "%d\n" ]

               ; t39 = call printf
               ; registers: [ a = t33, si = t44, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t46 = 4 + 5
               ; registers: [ a = t39 ]
               xor       rdi, rdi
               mov       edi, dword [LC002]
               add       edi, 5

               ; t47 = t46 * 2
               ; registers: [ a = t39, di = t46 ]
               xor       rax, rax
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, dword [LC001]
               imul      esi

               ; t48 = t47 > 16
               ; registers: [ di = t46, si = 2, a = t47 ]
               cmp       eax, 16
               mov       eax, 0
               setg      dil

               ; t49 = 2 == 3
               ; registers: [ si = 2, di = t48 ]
               cmp       esi, 3
               mov       esi, 0
               sete      sil

               ; t50 = ! t49
               ; registers: [ di = t48, si = t49 ]
               test      sil, sil
               mov       sil, 0
               sete      sil

               ; t51 = t48 && t50
               ; registers: [ di = t48, si = t50 ]
               and       dil, sil

               ; param "%d\n"
               ; registers: [ si = t50, di = t51 ]
               mov       sil, dil
               mov       rdi, LC004

               ; param t51
               ; registers: [ si = t51, di = "%d\n" ]

               ; t45 = call printf
               ; registers: [ si = t51, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t53 = 2 + 3
               ; registers: [ a = t45 ]
               xor       rdi, rdi
               mov       edi, dword [LC001]
               add       edi, 3

               ; t54 = t53 * 2
               ; registers: [ a = t45, di = t53 ]
               xor       rax, rax
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, dword [LC001]
               imul      esi

               ; t55 = 10 / t54
               ; registers: [ di = t53, si = 2, a = t54 ]
               mov       edi, eax
               xor       rdx, rdx
               xor       rax, rax
               mov       eax, dword [LC011]
               idiv      edi

               ; t56 = t55 * 100
               ; registers: [ si = 2, di = t54, a = t55 ]
               mov       edi, eax
               xor       rax, rax
               mov       eax, edi
               xor       rdx, rdx
               mov       edx, dword [LC013]
               imul      edx

               ; param "%d\n"
               ; registers: [ si = 2, di = t55, d = 100, a = t56 ]
               mov       rdi, LC004

               ; param t56
               ; registers: [ si = 2, d = 100, a = t56, di = "%d\n" ]
               mov       esi, eax

               ; t52 = call printf
               ; registers: [ d = 100, a = t56, di = "%d\n", si = t56 ]
               mov       al, 0
               call      printf

               ; t58 = 6 & 3
               ; registers: [ a = t52 ]
               xor       rdi, rdi
               mov       edi, dword [LC012]
               and       edi, 3

               ; t59 = 15 ^ t58
               ; registers: [ a = t52, di = t58 ]
               xor       rsi, rsi
               mov       esi, dword [LC014]
               xor       esi, edi

               ; param "%d\n"
               ; registers: [ a = t52, di = t58, si = t59 ]
               mov       rdi, LC004

               ; param t59
               ; registers: [ a = t52, si = t59, di = "%d\n" ]

               ; t57 = call printf
               ; registers: [ a = t52, si = t59, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t61 = 7 + 3
               ; registers: [ a = t57 ]
               xor       rdi, rdi
               mov       edi, dword [LC007]
               add       edi, 3

               ; t62 = t61 % 5
               ; registers: [ a = t57, di = t61 ]
               xor       rdx, rdx
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, dword [LC005]
               idiv      esi

               ; t63 = t62 == 0
               ; registers: [ di = t61, si = 5, d = t62 ]
               cmp       edx, 0
               mov       edx, 0
               sete      dil

               ; t64 = t63 || false
               ; registers: [ si = 5, di = t63 ]
               or        dil, 0

               ; param "%d\n"
               ; registers: [ si = 5, di = t64 ]
               mov       dl, dil
               mov       rdi, LC004

               ; param t64
               ; registers: [ si = 5, d = t64, di = "%d\n" ]
               mov       sil, dl

               ; t60 = call printf
               ; registers: [ d = t64, di = "%d\n", si = t64 ]
               mov       al, 0
               call      printf

               ; t66 = 8 - 6
               ; registers: [ a = t60 ]
               xor       rdi, rdi
               mov       edi, dword [LC006]
               sub       edi, 6

               ; t67 = - t66
               ; registers: [ a = t60, di = t66 ]
               neg       edi

               ; t68 = 9 * 1
               ; registers: [ a = t60, di = t67 ]
               xor       rax, rax
               xor       rax, rax
               mov       eax, dword [LC015]
               xor       rsi, rsi
               mov       esi, dword [LC003]
               imul      esi

               ; t69 = t67 + t68
               ; registers: [ di = t67, si = 1, a = t68 ]
               add       edi, eax

               ; t70 = - t69
               ; registers: [ si = 1, a = t68, di = t69 ]
               neg       edi

               ; t71 = t70 + 1
               ; registers: [ si = 1, a = t68, di = t70 ]
               add       edi, esi

               ; param "%d\n"
               ; registers: [ si = 1, a = t68, di = t71 ]
               mov       edx, edi
               mov       rdi, LC004

               ; param t71
               ; registers: [ si = 1, a = t68, d = t71, di = "%d\n" ]
               mov       esi, edx

               ; t65 = call printf
               ; registers: [ a = t68, d = t71, di = "%d\n", si = t71 ]
               mov       al, 0
               call      printf

               ; t73 = 2 * 3
               ; registers: [ a = t65 ]
               xor       rax, rax
               xor       rax, rax
               mov       eax, dword [LC001]
               xor       rdi, rdi
               mov       edi, dword [LC010]
               imul      edi

               ; t74 = t73 & 7
               ; registers: [ di = 3, a = t73 ]
               and       eax, 7

               ; t75 = t74 > 1
               ; registers: [ di = 3, a = t74 ]
               cmp       eax, 1
               mov       eax, 0
               setg      sil

               ; t76 = true || t75
               ; registers: [ di = 3, si = t75 ]
               xor       rdx, rdx
               mov       dl, byte [LC008]
               or        dl, sil

               ; param "%d\n"
               ; registers: [ di = 3, si = t75, d = t76 ]
               mov       rdi, LC004

               ; param t76
               ; registers: [ si = t75, d = t76, di = "%d\n" ]
               mov       sil, dl

               ; t72 = call printf
               ; registers: [ d = t76, di = "%d\n", si = t76 ]
               mov       al, 0
               call      printf

               ; t78 = 15 << 1
               ; registers: [ a = t72 ]
               xor       rdi, rdi
               mov       edi, dword [LC014]
               sal       edi, 1

               ; t79 = 3 >> 1
               ; registers: [ a = t72, di = t78 ]
               xor       rsi, rsi
               mov       esi, dword [LC010]
               sar       esi, 1

               ; t80 = t78 / t79
               ; registers: [ a = t72, di = t78, si = t79 ]
               xor       rdx, rdx
               mov       eax, edi
               idiv      esi

               ; param "%d\n"
               ; registers: [ di = t78, si = t79, a = t80 ]
               mov       rdi, LC004

               ; param t80
               ; registers: [ si = t79, a = t80, di = "%d\n" ]
               mov       esi, eax

               ; t77 = call printf
               ; registers: [ a = t80, di = "%d\n", si = t80 ]
               mov       al, 0
               call      printf

               ; t82 = 2 + 2
               ; registers: [ a = t77 ]
               xor       rdi, rdi
               mov       edi, dword [LC001]
               add       edi, edi

               ; t83 = 4 == t82
               ; registers: [ a = t77, di = t82 ]
               xor       rsi, rsi
               mov       esi, dword [LC002]
               mov       esi, edi
               cmp       esi, edi
               mov       esi, 0
               sete      dil

               ; t84 = 8 != 8
               ; registers: [ a = t77, si = t82, di = t83 ]
               xor       rsi, rsi
               mov       esi, dword [LC006]
               cmp       esi, esi
               mov       esi, 0
               setne     sil

               ; t85 = t83 && t84
               ; registers: [ a = t77, di = t83, si = t84 ]
               and       dil, sil

               ; t86 = t85 || false
               ; registers: [ a = t77, si = t84, di = t85 ]
               or        dil, 0

               ; param "%d\n"
               ; registers: [ a = t77, si = t84, di = t86 ]
               mov       sil, dil
               mov       rdi, LC004

               ; param t86
               ; registers: [ a = t77, si = t86, di = "%d\n" ]

               ; t81 = call printf
               ; registers: [ a = t77, si = t86, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t88 = 5 & 7
               ; registers: [ a = t81 ]
               xor       rdi, rdi
               mov       edi, dword [LC005]
               and       edi, 7

               ; t89 = ~ t88
               ; registers: [ a = t81, di = t88 ]
               not       edi

               ; t90 = type() t89
               ; registers: [ a = t81, di = t89 ]
               test      edi, edi
               mov       edi, 0
               setne     dil

               ; t91 = ! t90
               ; registers: [ a = t81, di = t90 ]
               test      dil, dil
               mov       dil, 0
               sete      dil

               ; param "%d\n"
               ; registers: [ a = t81, di = t91 ]
               mov       sil, dil
               mov       rdi, LC004

               ; param t91
               ; registers: [ a = t81, si = t91, di = "%d\n" ]

               ; t87 = call printf
               ; registers: [ a = t81, si = t91, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; t93 = 2 + 3
               ; registers: [ a = t87 ]
               xor       rdi, rdi
               mov       edi, dword [LC001]
               add       edi, 3

               ; t94 = 5 - 1
               ; registers: [ a = t87, di = t93 ]
               xor       rsi, rsi
               mov       esi, dword [LC005]
               sub       esi, 1

               ; t95 = t93 * t94
               ; registers: [ a = t87, di = t93, si = t94 ]
               xor       rax, rax
               mov       eax, edi
               imul      esi

               ; t96 = t95 % 7
               ; registers: [ di = t93, si = t94, a = t95 ]
               mov       edi, eax
               xor       rdx, rdx
               mov       eax, edi
               xor       rsi, rsi
               mov       esi, dword [LC007]
               idiv      esi

               ; t97 = t96 <= 3
               ; registers: [ di = t95, si = 7, d = t96 ]
               cmp       edx, 3
               mov       edx, 0
               setle     dil

               ; t98 = t97 && true
               ; registers: [ si = 7, di = t97 ]
               and       dil, 1

               ; param "%d\n"
               ; registers: [ si = 7, di = t98 ]
               mov       sil, dil
               mov       rdi, LC004

               ; param t98
               ; registers: [ si = t98, di = "%d\n" ]

               ; t92 = call printf
               ; registers: [ si = t98, di = "%d\n" ]
               mov       al, 0
               call      printf

               ; endfn main
               ; registers: [ a = t92 ]
               pop       rbp
               xor       rax, rax
               ret       




section .data

LC001:         dd        2
LC002:         dd        4
LC003:         dd        1
LC004:         db        `%d\n`, 0
LC005:         dd        5
LC006:         dd        8
LC007:         dd        7
LC008:         db        1
LC009:         db        0
LC010:         dd        3
LC011:         dd        10
LC012:         dd        6
LC013:         dd        100
LC014:         dd        15
LC015:         dd        9