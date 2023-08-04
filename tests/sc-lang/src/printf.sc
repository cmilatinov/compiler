extern fn printf(fmt: string, ...) -> int;

def main() -> int {
    printf('Hello World!\nMy name is %s %s %d %f',
    'Cristian', 'Milatinov', 23, (double)1.0);
}
