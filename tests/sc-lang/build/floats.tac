live = {  }
next = {  }
B1 {
    extern printf             in {  }                   out {  }
}

live = { 'DAB', 'Hello World: %s' }
next = {  }
main {
    fn main                   in { 'DAB', 'Hello World: %s' } out { 'DAB', 'Hello World: %s' }
    param 'Hello World: %s'   in { 'DAB', 'Hello World: %s' } out { 'DAB' }
    param 'DAB'               in { 'DAB' }              out {  }
    t1 = call printf          in {  }                   out {  }
    endfn main                in {  }                   out {  }
}