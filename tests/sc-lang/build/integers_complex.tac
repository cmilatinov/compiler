live = {  }
next = {  }
B1 {
    extern printf             in {  }                   out {  }
}

live = { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
next = {  }
main {
    fn main                   in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t2 = 2 + 3                in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t2, 10 }
    t3 = t2 * 4               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t2, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10, t3 }
    t4 = 1 + 1                in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10, t3 } out { t4, false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10, t3 }
    t5 = t3 / t4              in { t4, false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10, t3 } out { t5, false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    param "%d\n"              in { t5, false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { t5, false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    param t5                  in { t5, false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t1 = call printf          in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t7 = - 5                  in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, t7, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t8 = t7 + 1               in { false, t7, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, t8, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t9 = - t8                 in { false, 15, t8, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, t9, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    param "%d\n"              in { false, 15, 16, t9, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, t9, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    param t9                  in { false, 15, 16, t9, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t6 = call printf          in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t11 = 5 > 2               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t11, 5, 6, 7, 8, 9, 10 }
    t12 = ! t11               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t11, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t12, 6, 7, 8, 9, 10 }
    t13 = 8 & 3               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t12, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t12, 6, t13, 7, 8, 9, 10 }
    t14 = type() t13          in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t12, 6, t13, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t12, 6, 7, t14, 8, 9, 10 }
    t15 = t12 || t14          in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t12, 6, 7, t14, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t15, 9, 10 }
    param "%d\n"              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t15, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t15, 9, 10 }
    param t15                 in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t15, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t10 = call printf         in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t17 = 4 <= 5              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t17, 10 }
    t18 = 2 >= 2              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t17, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t17, t18, 10 }
    t19 = t17 && t18          in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t17, t18, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t19, 10 }
    param "%d\n"              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t19, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t19, 10 }
    param t19                 in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t19, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t16 = call printf         in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t21 = 7 ^ 5               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, t21, 4, 5, 6, 7, 8, 9, 10 }
    t22 = ~ t21               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, t21, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t22, 5, 6, 7, 8, 9, 10 }
    param "%d\n"              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t22, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t22, 5, 6, 7, 8, 9, 10 }
    param t22                 in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t22, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t20 = call printf         in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t24 = true && false       in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, t24, 7, 8, 9, 10 }
    t25 = false || true       in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, t24, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, t24, 7, t25, 8, 9, 10 }
    t26 = t24 || t25          in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, t24, 7, t25, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t26, 9, 10 }
    param "%d\n"              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t26, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t26, 9, 10 }
    param t26                 in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t26, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t23 = call printf         in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t28 = 3 * 2               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t28, 10 }
    t29 = 8 % t28             in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t28, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t29, 10 }
    param "%d\n"              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t29, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t29, 10 }
    param t29                 in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t29, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t27 = call printf         in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t31 = 10 >> 2             in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, t31, 3, 4, 5, 6, 7, 8, 9, 10 }
    t32 = t31 ^ 2             in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, t31, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, t32, 4, 5, 6, 7, 8, 9, 10 }
    param "%d\n"              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, t32, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, t32, 4, 5, 6, 7, 8, 9, 10 }
    param t32                 in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, t32, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t30 = call printf         in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t34 = - 1                 in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t34, 6, 7, 8, 9, 10 }
    t35 = 5 - 7               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t34, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t34, 6, t35, 7, 8, 9, 10 }
    t36 = t34 * t35           in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, t34, 6, t35, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, t36, 8, 9, 10 }
    t37 = 8 & 9               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, t36, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, t36, 8, t37, 9, 10 }
    t38 = t36 + t37           in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, t36, 8, t37, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t38, 10 }
    param "%d\n"              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t38, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t38, 10 }
    param t38                 in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, t38, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t33 = call printf         in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t40 = 6 == 7              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, t40, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t41 = ! t40               in { false, 15, 16, true, "%d\n", 0, t40, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, t41, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t42 = 2 | 3               in { false, 15, 16, true, "%d\n", 0, 1, t41, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, t41, 100, 2, t42, 3, 4, 5, 6, 7, 8, 9, 10 }
    t43 = t42 > 2             in { false, 15, 16, true, "%d\n", 0, 1, t41, 100, 2, t42, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, t41, 100, 2, 3, t43, 4, 5, 6, 7, 8, 9, 10 }
    t44 = t41 && t43          in { false, 15, 16, true, "%d\n", 0, 1, t41, 100, 2, 3, t43, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t44, 5, 6, 7, 8, 9, 10 }
    param "%d\n"              in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t44, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t44, 5, 6, 7, 8, 9, 10 }
    param t44                 in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, t44, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t39 = call printf         in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t46 = 4 + 5               in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, t46, 7, 8, 9, 10 }
    t47 = t46 * 2             in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, t46, 7, 8, 9, 10 } out { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, t47, 8, 9, 10 }
    t48 = t47 > 16            in { false, 15, 16, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, t47, 8, 9, 10 } out { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t48, 9, 10 }
    t49 = 2 == 3              in { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t48, 9, 10 } out { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t48, 9, t49, 10 }
    t50 = ! t49               in { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t48, 9, t49, 10 } out { false, 15, true, t50, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t48, 9, 10 }
    t51 = t48 && t50          in { false, 15, true, t50, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, t48, 9, 10 } out { false, 15, true, "%d\n", 0, t51, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", 0, t51, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 0, t51, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    param t51                 in { false, 15, true, "%d\n", 0, t51, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t45 = call printf         in { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t53 = 2 + 3               in { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 0, 1, 100, 2, t53, 3, 4, 5, 6, 7, 8, 9, 10 }
    t54 = t53 * 2             in { false, 15, true, "%d\n", 0, 1, 100, 2, t53, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 0, 1, 100, 2, 3, t54, 4, 5, 6, 7, 8, 9, 10 }
    t55 = 10 / t54            in { false, 15, true, "%d\n", 0, 1, 100, 2, 3, t54, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, t55, 5, 6, 7, 8, 9 }
    t56 = t55 * 100           in { false, 15, true, "%d\n", 0, 1, 100, 2, 3, 4, t55, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, t56, 6, 7, 8, 9 }
    param "%d\n"              in { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, t56, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, t56, 6, 7, 8, 9 }
    param t56                 in { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, t56, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 }
    t52 = call printf         in { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 }
    t58 = 6 & 3               in { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, t58, 8, 9 }
    t59 = 15 ^ t58            in { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, t58, 8, 9 } out { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, t59, 9 }
    param "%d\n"              in { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, t59, 9 } out { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, t59, 9 }
    param t59                 in { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, t59, 9 } out { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 }
    t57 = call printf         in { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 }
    t61 = 7 + 3               in { false, 15, true, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, t61, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 }
    t62 = t61 % 5             in { false, 15, true, t61, "%d\n", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 0, t62, 1, 2, 3, 4, 5, 6, 7, 8, 9 }
    t63 = t62 == 0            in { false, 15, true, "%d\n", 0, t62, 1, 2, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 1, t63, 2, 3, 4, 5, 6, 7, 8, 9 }
    t64 = t63 || false        in { false, 15, true, "%d\n", 1, t63, 2, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 1, 2, t64, 3, 4, 5, 6, 7, 8, 9 }
    param "%d\n"              in { false, 15, true, "%d\n", 1, 2, t64, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 1, 2, t64, 3, 4, 5, 6, 7, 8, 9 }
    param t64                 in { false, 15, true, "%d\n", 1, 2, t64, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9 }
    t60 = call printf         in { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9 }
    t66 = 8 - 6               in { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9 } out { false, 15, true, "%d\n", 1, 2, 3, 4, t66, 5, 7, 8, 9 }
    t67 = - t66               in { false, 15, true, "%d\n", 1, 2, 3, 4, t66, 5, 7, 8, 9 } out { false, 15, true, "%d\n", 1, 2, 3, 4, 5, t67, 7, 8, 9 }
    t68 = 9 * 1               in { false, 15, true, "%d\n", 1, 2, 3, 4, 5, t67, 7, 8, 9 } out { false, 15, true, "%d\n", 1, 2, 3, 4, 5, t67, t68, 7, 8 }
    t69 = t67 + t68           in { false, 15, true, "%d\n", 1, 2, 3, 4, 5, t67, t68, 7, 8 } out { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, t69, 8 }
    t70 = - t69               in { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, t69, 8 } out { false, 15, t70, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    t71 = t70 + 1             in { false, 15, t70, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, 15, true, t71, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    param "%d\n"              in { false, 15, true, t71, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, 15, true, t71, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    param t71                 in { false, 15, true, t71, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    t65 = call printf         in { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    t73 = 2 * 3               in { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, 15, true, "%d\n", t73, 1, 2, 3, 4, 5, 7, 8 }
    t74 = t73 & 7             in { false, 15, true, "%d\n", t73, 1, 2, 3, 4, 5, 7, 8 } out { false, 15, true, "%d\n", 1, t74, 2, 3, 4, 5, 7, 8 }
    t75 = t74 > 1             in { false, 15, true, "%d\n", 1, t74, 2, 3, 4, 5, 7, 8 } out { false, 15, true, "%d\n", 1, 2, t75, 3, 4, 5, 7, 8 }
    t76 = true || t75         in { false, 15, true, "%d\n", 1, 2, t75, 3, 4, 5, 7, 8 } out { false, 15, true, "%d\n", 1, 2, 3, t76, 4, 5, 7, 8 }
    param "%d\n"              in { false, 15, true, "%d\n", 1, 2, 3, t76, 4, 5, 7, 8 } out { false, 15, true, "%d\n", 1, 2, 3, t76, 4, 5, 7, 8 }
    param t76                 in { false, 15, true, "%d\n", 1, 2, 3, t76, 4, 5, 7, 8 } out { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    t72 = call printf         in { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    t78 = 15 << 1             in { false, 15, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, true, "%d\n", 1, 2, 3, 4, 5, t78, 7, 8 }
    t79 = 3 >> 1              in { false, true, "%d\n", 1, 2, 3, 4, 5, t78, 7, 8 } out { false, true, "%d\n", 1, 2, 3, 4, 5, t78, t79, 7, 8 }
    t80 = t78 / t79           in { false, true, "%d\n", 1, 2, 3, 4, 5, t78, t79, 7, 8 } out { false, t80, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    param "%d\n"              in { false, t80, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, t80, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    param t80                 in { false, t80, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    t77 = call printf         in { false, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    t82 = 2 + 2               in { false, true, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, true, t82, "%d\n", 1, 2, 3, 4, 5, 7, 8 }
    t83 = 4 == t82            in { false, true, t82, "%d\n", 1, 2, 3, 4, 5, 7, 8 } out { false, true, t83, "%d\n", 1, 2, 3, 5, 7, 8 }
    t84 = 8 != 8              in { false, true, t83, "%d\n", 1, 2, 3, 5, 7, 8 } out { false, true, t83, "%d\n", t84, 1, 2, 3, 5, 7 }
    t85 = t83 && t84          in { false, true, t83, "%d\n", t84, 1, 2, 3, 5, 7 } out { false, true, "%d\n", 1, t85, 2, 3, 5, 7 }
    t86 = t85 || false        in { false, true, "%d\n", 1, t85, 2, 3, 5, 7 } out { "%d\n", true, 3, 7, 1, 5, 2, t86 }
    param "%d\n"              in { "%d\n", true, 3, 7, 1, 5, 2, t86 } out { "%d\n", true, 3, 7, 1, 5, 2, t86 }
    param t86                 in { "%d\n", true, 3, 7, 1, 5, 2, t86 } out { "%d\n", true, 3, 7, 1, 5, 2 }
    t81 = call printf         in { "%d\n", true, 3, 7, 1, 5, 2 } out { "%d\n", true, 3, 7, 1, 5, 2 }
    t88 = 5 & 7               in { "%d\n", true, 3, 7, 1, 5, 2 } out { "%d\n", true, 3, 7, 1, 5, 2, t88 }
    t89 = ~ t88               in { "%d\n", true, 3, 7, 1, 5, 2, t88 } out { "%d\n", true, 3, 7, 1, 5, 2, t89 }
    t90 = type() t89          in { "%d\n", true, 3, 7, 1, 5, 2, t89 } out { "%d\n", true, 3, 7, 1, 5, 2, t90 }
    t91 = ! t90               in { "%d\n", true, 3, 7, 1, 5, 2, t90 } out { "%d\n", true, 3, 7, 1, 5, 2, t91 }
    param "%d\n"              in { "%d\n", true, 3, 7, 1, 5, 2, t91 } out { "%d\n", true, 3, 7, 1, 5, 2, t91 }
    param t91                 in { "%d\n", true, 3, 7, 1, 5, 2, t91 } out { "%d\n", true, 3, 7, 1, 5, 2 }
    t87 = call printf         in { "%d\n", true, 3, 7, 1, 5, 2 } out { "%d\n", true, 3, 7, 1, 5, 2 }
    t93 = 2 + 3               in { "%d\n", true, 3, 7, 1, 5, 2 } out { "%d\n", true, 3, 7, t93, 5, 1 }
    t94 = 5 - 1               in { "%d\n", true, 3, 7, t93, 5, 1 } out { "%d\n", true, 3, 7, t93, t94 }
    t95 = t93 * t94           in { "%d\n", true, 3, 7, t93, t94 } out { "%d\n", true, 3, t95, 7 }
    t96 = t95 % 7             in { "%d\n", true, 3, t95, 7 } out { "%d\n", true, t96, 3 }
    t97 = t96 <= 3            in { "%d\n", true, t96, 3 } out { "%d\n", t97, true }
    t98 = t97 && true         in { "%d\n", t97, true }  out { t98, "%d\n" }
    param "%d\n"              in { t98, "%d\n" }        out { t98 }
    param t98                 in { t98 }                out {  }
    t92 = call printf         in {  }                   out {  }
    endfn main                in {  }                   out {  }
}