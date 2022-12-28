def main() {
    let n = 10;
    let a = 0, b = 1;
    let i: int;
    for (i = 0; i < n; i++) {
        let c = a + b;
        a = b;
        b = c;
    }
}