def test(a: int, b: int, c: int, d: int) -> int {
    let e = d + a;
    let f = b + c;
    f = f + b;
    if (e) {
        d = e + f;
    } else {
        d = e - f;
    }
    let g = d;
    return g;
}

def sqrt(x: float) -> float {
    return x * x;
}

def main() -> int {
    let a = 2 * 3 + 4;
    let b = 2;
    let c = 1;
    let x = (-b + sqrt(b ^^ 2 - 4 * a * c)) / (2 * a);
    let arr: int[2];
    arr[0] = 0;
    return a + 3;
}