extern fn printf(fmt: string, ...) -> int;

def main() -> int {
    // 3
    let a = 6 + -2 - (3 / 2 * 3) % 2;
    printf("a = %d\n", a);
    // 4
    let b = (true || false && true) + 3;
    printf("b = %d\n", b);
    // 3
    let c = ~(-1 * 2) + 4 / 2;
    printf("c = %d\n", c);
    // 1
    let d: int = !!2300;
    printf("d = %d\n", d);
    // 6
    let e = (2 ^ 3 + 23) * 2 / 7;
    printf("e = %d\n", e);
    // 39
    let f = a * (b * c - d) + e;
    printf("f = %d\n", f);
}
