live = {  }
next = {  }
B1 {
    extern printf             in {  }                   out {  }
}

live = { 'Hello World!\nMy name is %s %s %d %f', 23, 'Milatinov', 'Cristian', 1.0 }
next = {  }
main {
    fn main                   in { 'Hello World!\nMy name is %s %s %d %f', 23, 'Milatinov', 'Cristian', 1.0 } out { 'Hello World!\nMy name is %s %s %d %f', 23, 'Milatinov', 'Cristian', 1.0 }
    t2 = type() 1.0           in { 'Hello World!\nMy name is %s %s %d %f', 23, 'Milatinov', 'Cristian', 1.0 } out { t2, 23, 'Milatinov', 'Cristian', 'Hello World!\nMy name is %s %s %d %f' }
    param 'Hello World!\nMy name is %s %s %d %f'in { t2, 23, 'Milatinov', 'Cristian', 'Hello World!\nMy name is %s %s %d %f' } out { t2, 23, 'Milatinov', 'Cristian' }
    param 'Cristian'          in { t2, 23, 'Milatinov', 'Cristian' } out { t2, 23, 'Milatinov' }
    param 'Milatinov'         in { t2, 23, 'Milatinov' } out { t2, 23 }
    param 23                  in { t2, 23 }             out { t2 }
    param t2                  in { t2 }                 out {  }
    t1 = call printf          in {  }                   out {  }
    endfn main                in {  }                   out {  }
}