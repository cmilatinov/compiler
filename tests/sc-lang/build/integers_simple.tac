live = {  }
next = {  }
B1 {
    extern printf             in {  }                   out {  }
}

live = { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
next = {  }
main {
    fn main                   in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t2 = - 5                  in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, t2, 10 }
    t3 = - t2                 in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, t2, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, t3 }
    param "%d\n"              in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, t3 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, t3 }
    param t3                  in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, t3 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t1 = call printf          in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t5 = 4 == 4               in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, t5, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t6 = ! t5                 in { 12, t5, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, t6, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t7 = 6 > 3                in { 12, t6, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, t6, false, t7, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t8 = t6 && t7             in { 12, t6, false, t7, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, t8, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    param "%d\n"              in { 12, false, 15, t8, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, t8, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    param t8                  in { 12, false, 15, t8, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t4 = call printf          in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t10 = ~ 15                in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, t10, 4, 5, 6, 7, 8, 9, 10 }
    param "%d\n"              in { 12, false, 15, true, "%d\n", 1, 2, 3, t10, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, t10, 4, 5, 6, 7, 8, 9, 10 }
    param t10                 in { 12, false, 15, true, "%d\n", 1, 2, 3, t10, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t9 = call printf          in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t12 = 2 + 3               in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, t12, 6, 7, 8, 9, 10 }
    t13 = 7 * t12             in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, t12, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, t13, 7, 8, 9, 10 }
    param "%d\n"              in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, t13, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, t13, 7, 8, 9, 10 }
    param t13                 in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, t13, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t11 = call printf         in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t15 = 10 % 3              in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, t15, 9, 10 }
    param "%d\n"              in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, t15, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, t15, 9, 10 }
    param t15                 in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, t15, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t14 = call printf         in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t17 = 1 << 3              in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, t17, 10 }
    t18 = t17 - 1             in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, t17, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, t18, 10 }
    param "%d\n"              in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, t18, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, t18, 10 }
    param t18                 in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, t18, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t16 = call printf         in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t20 = 12 >> 1             in { 12, false, 15, true, "%d\n", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, t20, 3, 4, 5, 6, 7, 8, 9, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", 2, t20, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, t20, 3, 4, 5, 6, 7, 8, 9, 10 }
    param t20                 in { false, 15, true, "%d\n", 2, t20, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t19 = call printf         in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t22 = false || true       in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, t22, 5, 6, 7, 8, 9, 10 }
    t23 = true && t22         in { false, 15, true, "%d\n", 2, 3, 4, t22, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, t23, 6, 7, 8, 9, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", 2, 3, 4, 5, t23, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, t23, 6, 7, 8, 9, 10 }
    param t23                 in { false, 15, true, "%d\n", 2, 3, 4, 5, t23, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t21 = call printf         in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t25 = - 2                 in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t25, 8, 9, 10 }
    t26 = 10 / t25            in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t25, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, t26, 9, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, t26, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, t26, 9, 10 }
    param t26                 in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, t26, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t24 = call printf         in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 }
    t28 = 8 != 8              in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 8, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, t28, 10 }
    t29 = ! t28               in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, t28, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, t29, 10 }
    t30 = 5 <= 4              in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, t29, 10 } out { false, 15, true, "%d\n", t30, 2, 3, 4, 5, 6, 7, 9, t29, 10 }
    t31 = t29 || t30          in { false, 15, true, "%d\n", t30, 2, 3, 4, 5, 6, 7, 9, t29, 10 } out { false, 15, true, "%d\n", 2, t31, 3, 4, 5, 6, 7, 9, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", 2, t31, 3, 4, 5, 6, 7, 9, 10 } out { false, 15, true, "%d\n", 2, t31, 3, 4, 5, 6, 7, 9, 10 }
    param t31                 in { false, 15, true, "%d\n", 2, t31, 3, 4, 5, 6, 7, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, 10 }
    t27 = call printf         in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, 10 }
    t33 = 2 | 6               in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, t33, 5, 6, 7, 9, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", 2, 3, 4, t33, 5, 6, 7, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, t33, 5, 6, 7, 9, 10 }
    param t33                 in { false, 15, true, "%d\n", 2, 3, 4, t33, 5, 6, 7, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, 10 }
    t32 = call printf         in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, 10 }
    t35 = 3 ^ 9               in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 9, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, t35, 7, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, t35, 7, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, t35, 7, 10 }
    param t35                 in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, t35, 7, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 10 }
    t34 = call printf         in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 10 }
    t37 = - 5                 in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t37, 10 }
    t38 = - t37               in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t37, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t38, 10 }
    t39 = - t38               in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t38, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t39, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t39, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t39, 10 }
    param t39                 in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, t39, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 10 }
    t36 = call printf         in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 10 }
    t41 = 2 + 3               in { false, 15, true, "%d\n", 2, 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", t41, 3, 4, 5, 6, 7, 10 }
    t42 = t41 * 4             in { false, 15, true, "%d\n", t41, 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", t42, 3, 4, 5, 6, 7, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", t42, 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", t42, 3, 4, 5, 6, 7, 10 }
    param t42                 in { false, 15, true, "%d\n", t42, 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", 3, 4, 5, 6, 7, 10 }
    t40 = call printf         in { false, 15, true, "%d\n", 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", 3, 4, 5, 6, 7, 10 }
    t44 = 7 > 5               in { false, 15, true, "%d\n", 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", 3, 4, t44, 5, 6, 7, 10 }
    t45 = 3 <= 3              in { false, 15, true, "%d\n", 3, 4, t44, 5, 6, 7, 10 } out { false, 15, true, "%d\n", 3, 4, t44, 5, t45, 6, 7, 10 }
    t46 = t44 && t45          in { false, 15, true, "%d\n", 3, 4, t44, 5, t45, 6, 7, 10 } out { false, 15, true, "%d\n", 3, 4, 5, 6, t46, 7, 10 }
    param "%d\n"              in { false, 15, true, "%d\n", 3, 4, 5, 6, t46, 7, 10 } out { false, 15, true, "%d\n", 3, 4, 5, 6, t46, 7, 10 }
    param t46                 in { false, 15, true, "%d\n", 3, 4, 5, 6, t46, 7, 10 } out { false, 15, true, "%d\n", 3, 4, 5, 6, 7, 10 }
    t43 = call printf         in { false, 15, true, "%d\n", 3, 4, 5, 6, 7, 10 } out { false, 15, true, "%d\n", 3, 4, 5, 6, 7, 10 }
    t48 = false && true       in { false, 15, true, "%d\n", 3, 4, 5, 6, 7, 10 } out { 15, true, "%d\n", 3, 4, 5, 6, 7, t48, 10 }
    t49 = true || t48         in { 15, true, "%d\n", 3, 4, 5, 6, 7, t48, 10 } out { 15, "%d\n", 3, 4, 5, 6, 7, t49, 10 }
    param "%d\n"              in { 15, "%d\n", 3, 4, 5, 6, 7, t49, 10 } out { 15, "%d\n", 3, 4, 5, 6, 7, t49, 10 }
    param t49                 in { 15, "%d\n", 3, 4, 5, 6, 7, t49, 10 } out { "%d\n", 3, 7, 4, 15, 6, 5, 10 }
    t47 = call printf         in { "%d\n", 3, 7, 4, 15, 6, 5, 10 } out { "%d\n", 3, 7, 4, 15, 6, 5, 10 }
    t51 = 10 % 6              in { "%d\n", 3, 7, 4, 15, 6, 5, 10 } out { "%d\n", 3, 7, 4, 15, 6, 5, t51 }
    param "%d\n"              in { "%d\n", 3, 7, 4, 15, 6, 5, t51 } out { "%d\n", 3, 7, 4, 15, 6, 5, t51 }
    param t51                 in { "%d\n", 3, 7, 4, 15, 6, 5, t51 } out { "%d\n", 3, 7, 4, 15, 6, 5 }
    t50 = call printf         in { "%d\n", 3, 7, 4, 15, 6, 5 } out { "%d\n", 3, 7, 4, 15, 6, 5 }
    t53 = 5 == 5              in { "%d\n", 3, 7, 4, 15, 6, 5 } out { "%d\n", 3, 7, 4, 15, 6, t53 }
    t54 = 7 != 7              in { "%d\n", 3, 7, 4, 15, 6, t53 } out { "%d\n", 3, 7, 4, 15, 6, t53, t54 }
    t55 = ! t54               in { "%d\n", 3, 7, 4, 15, 6, t53, t54 } out { "%d\n", 3, 7, 4, 15, 6, t53, t55 }
    t56 = t53 && t55          in { "%d\n", 3, 7, 4, 15, 6, t53, t55 } out { "%d\n", 3, 7, 4, 15, 6, t56 }
    param "%d\n"              in { "%d\n", 3, 7, 4, 15, 6, t56 } out { "%d\n", 3, 7, 4, 15, 6, t56 }
    param t56                 in { "%d\n", 3, 7, 4, 15, 6, t56 } out { "%d\n", 3, 7, 4, 15, 6 }
    t52 = call printf         in { "%d\n", 3, 7, 4, 15, 6 } out { "%d\n", 3, 7, 4, 15, 6 }
    t58 = 15 & 6              in { "%d\n", 3, 7, 4, 15, 6 } out { "%d\n", 3, 7, 4, t58 }
    param "%d\n"              in { "%d\n", 3, 7, 4, t58 } out { "%d\n", 3, 7, 4, t58 }
    param t58                 in { "%d\n", 3, 7, 4, t58 } out { "%d\n", 3, 7, 4 }
    t57 = call printf         in { "%d\n", 3, 7, 4 }    out { "%d\n", 3, 7, 4 }
    t60 = - 4                 in { "%d\n", 3, 7, 4 }    out { "%d\n", t60, 7, 3 }
    t61 = 7 * 3               in { "%d\n", t60, 7, 3 }  out { "%d\n", t60, t61 }
    t62 = t60 + t61           in { "%d\n", t60, t61 }   out { t62, "%d\n" }
    param "%d\n"              in { t62, "%d\n" }        out { t62 }
    param t62                 in { t62 }                out {  }
    t59 = call printf         in {  }                   out {  }
    endfn main                in {  }                   out {  }
}