use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

impl Point {
    /// 基本构造函数
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    /// 从两个数字构造
    pub fn from_xy(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    /// 从元组构造
    pub fn from_tuple(tuple: (f64, f64)) -> Self {
        Self {
            x: tuple.0,
            y: tuple.1,
        }
    }

    /// 从数组构造
    pub fn from_array(arr: [f64; 2]) -> Self {
        Self {
            x: arr[0],
            y: arr[1],
        }
    }
}

// 从 (f64, f64) 元组创建 Point
impl From<(f64, f64)> for Point {
    fn from(tuple: (f64, f64)) -> Self {
        Self::from_tuple(tuple)
    }
}

// 从 [f64; 2] 数组创建 Point
impl From<[f64; 2]> for Point {
    fn from(arr: [f64; 2]) -> Self {
        Self::from_array(arr)
    }
}

// 单元测试
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_point_constructors() {
        // 使用 new 方法
        let p1 = Point::new(1.0, 2.0);
        assert_eq!(p1.x, 1.0);
        assert_eq!(p1.y, 2.0);

        // 使用 From<(f64, f64)>
        let p2 = Point::from((3.0, 4.0));
        assert_eq!(p2.x, 3.0);
        assert_eq!(p2.y, 4.0);

        // 使用 From<[f64; 2]>
        let p3 = Point::from([5.0, 6.0]);
        assert_eq!(p3.x, 5.0);
        assert_eq!(p3.y, 6.0);

        let p4: Point = (1.2, 3.4).into();
        assert_eq!(p4.x, 1.2);
        assert_eq!(p4.y, 3.4);
    }
}
