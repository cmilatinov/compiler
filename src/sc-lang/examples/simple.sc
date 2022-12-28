def main() -> int {
    let b: int = 2;
    let c: int = 3;
    let f: int = 6;
    while (true) {
        let a = b + c;
        let d = -a;
        let e = d + f;
        if (true) {
            f = 2 * e;
        } else {
            b = d + e;
            e = e - 1;
        }
        a = f + c;
    }
    return b;
}