default rel

global main

section .text

               ; extern printf
               extern    printf

               ; fn main
main:          push      rbp
               mov       rbp, rsp

               ; param 'Hello World: %s'
               mov       rdi, LC001

               ; param 'DAB'
               ; registers: [ di = 'Hello World: %s' ]
               mov       rsi, LC002

               ; t1 = call printf
               ; registers: [ di = 'Hello World: %s', si = 'DAB' ]
               call      printf

               ; endfn main
               ; registers: [ a = t1 ]
               pop       rbp
               xor       rax, rax
               ret       




section .data

LC001:         db        `Hello World: %s`, 0
LC002:         db        `DAB`, 0