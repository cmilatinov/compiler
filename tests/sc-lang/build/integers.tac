live = {  }
next = {  }
B1 {
    extern printf             in {  }                   out {  }
}

live = { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 6, 7 }
next = {  }
main {
    fn main                   in { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 6, 7 } out { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 6, 7 }
    t1 = - 2                  in { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 6, 7 } out { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 6, 7, t1 }
    t2 = 6 + t1               in { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 6, 7, t1 } out { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7, t2 }
    t3 = 3 / 2                in { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7, t2 } out { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7, t2, t3 }
    t4 = t3 * 3               in { 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7, t2, t3 } out { t4, 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7, t2 }
    t5 = t4 % 2               in { t4, 2300, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7, t2 } out { 2300, 23, t5, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7, t2 }
    t6 = t2 - t5              in { 2300, 23, t5, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7, t2 } out { 2300, 23, t6, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    a = t6                    in { 2300, 23, t6, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    param "a = %d\n"          in { 2300, a, 23, false, "a = %d\n", "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, false, "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    param a                   in { 2300, a, 23, false, "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, false, "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    t7 = call printf          in { 2300, a, 23, false, "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, false, "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    t8 = false && true        in { 2300, a, 23, false, "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, t8, "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    t9 = true || t8           in { 2300, a, 23, t8, "b = %d\n", true, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, t9, "b = %d\n", "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    t10 = type() t9           in { 2300, a, 23, t9, "b = %d\n", "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, "b = %d\n", "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, t10, 4, 7 }
    t11 = t10 + 3             in { 2300, a, 23, "b = %d\n", "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, t10, 4, 7 } out { 2300, a, 23, "b = %d\n", "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, t11, 7 }
    b = t11                   in { 2300, a, 23, "b = %d\n", "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, t11, 7 } out { 2300, a, 23, b, "b = %d\n", "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    param "b = %d\n"          in { 2300, a, 23, b, "b = %d\n", "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, b, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    param b                   in { 2300, a, 23, b, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, b, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    t12 = call printf         in { 2300, a, 23, b, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, b, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 }
    t13 = - 1                 in { 2300, a, 23, b, "c = %d\n", "d = %d\n", 1, "e = %d\n", 2, "f = %d\n", 3, 4, 7 } out { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 4, t13, 7 }
    t14 = t13 * 2             in { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 4, t13, 7 } out { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 4, 7, t14 }
    t15 = ~ t14               in { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 4, 7, t14 } out { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 4, 7, t15 }
    t16 = 4 / 2               in { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 4, 7, t15 } out { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7, t15, t16 }
    t17 = t15 + t16           in { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7, t15, t16 } out { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7, t17 }
    c = t17                   in { 2300, a, 23, b, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7, t17 } out { 2300, a, 23, b, c, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 }
    param "c = %d\n"          in { 2300, a, 23, b, c, "c = %d\n", "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 } out { 2300, a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 }
    param c                   in { 2300, a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 } out { 2300, a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 }
    t18 = call printf         in { 2300, a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 } out { 2300, a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 }
    t19 = type() 2300         in { 2300, a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 } out { a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7, t19 }
    t20 = ! t19               in { a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7, t19 } out { a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", t20, 3, 7 }
    t21 = ! t20               in { a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", t20, 3, 7 } out { a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, t21, 7 }
    t22 = type() t21          in { a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, t21, 7 } out { a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, t22, 7 }
    d = t22                   in { a, 23, b, c, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, t22, 7 } out { a, 23, b, c, d, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 }
    param "d = %d\n"          in { a, 23, b, c, d, "d = %d\n", "e = %d\n", 2, "f = %d\n", 3, 7 } out { a, 23, b, c, d, "e = %d\n", 2, "f = %d\n", 3, 7 }
    param d                   in { a, 23, b, c, d, "e = %d\n", 2, "f = %d\n", 3, 7 } out { a, 23, b, c, d, "e = %d\n", 2, "f = %d\n", 3, 7 }
    t23 = call printf         in { a, 23, b, c, d, "e = %d\n", 2, "f = %d\n", 3, 7 } out { a, 23, b, c, d, "e = %d\n", 2, "f = %d\n", 3, 7 }
    t24 = 3 + 23              in { a, 23, b, c, d, "e = %d\n", 2, "f = %d\n", 3, 7 } out { a, b, c, d, "e = %d\n", 2, "f = %d\n", t24, 7 }
    t25 = 2 ^ t24             in { a, b, c, d, "e = %d\n", 2, "f = %d\n", t24, 7 } out { a, b, c, d, "e = %d\n", 2, "f = %d\n", 7, t25 }
    t26 = t25 * 2             in { a, b, c, d, "e = %d\n", 2, "f = %d\n", 7, t25 } out { "f = %d\n", "e = %d\n", a, d, b, c, t26, 7 }
    t27 = t26 / 7             in { "f = %d\n", "e = %d\n", a, d, b, c, t26, 7 } out { "f = %d\n", "e = %d\n", a, d, b, c, t27 }
    e = t27                   in { "f = %d\n", "e = %d\n", a, d, b, c, t27 } out { "f = %d\n", e, a, d, b, c, "e = %d\n" }
    param "e = %d\n"          in { "f = %d\n", e, a, d, b, c, "e = %d\n" } out { "f = %d\n", e, a, d, b, c }
    param e                   in { "f = %d\n", e, a, d, b, c } out { "f = %d\n", e, a, d, b, c }
    t28 = call printf         in { "f = %d\n", e, a, d, b, c } out { "f = %d\n", e, a, d, b, c }
    t29 = b * c               in { "f = %d\n", e, a, d, b, c } out { "f = %d\n", e, a, t29, d }
    t30 = t29 - d             in { "f = %d\n", e, a, t29, d } out { "f = %d\n", e, a, t30 }
    t31 = a * t30             in { "f = %d\n", e, a, t30 } out { "f = %d\n", t31, e }
    t32 = t31 + e             in { "f = %d\n", t31, e } out { "f = %d\n", t32 }
    f = t32                   in { "f = %d\n", t32 }    out { f, "f = %d\n" }
    param "f = %d\n"          in { f, "f = %d\n" }      out { f }
    param f                   in { f }                  out {  }
    t33 = call printf         in {  }                   out {  }
    endfn main                in {  }                   out {  }
}