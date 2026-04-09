use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

impl Point {
    /// 创建一个新的点
    ///
    /// # 示例
    ///
    /// ```
    /// use wmts::point::Point;
    ///
    /// let p = Point::new(3.0, 4.0);
    /// assert_eq!(p.x, 3.0);
    /// assert_eq!(p.y, 4.0);
    /// ```
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    /// 从两个数字构造
    ///
    /// # 示例
    /// ```
    /// use wmts::point::Point;    ///
    ///
    /// let p = Point::from_xy(5.0, 6.0);
    /// assert_eq!(p.x, 5.0);
    /// assert_eq!(p.y, 6.0);
    /// ```
    pub fn from_xy(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    /// 从元组构造
    /// # 示例
    /// ```
    /// use wmts::point::Point;
    ///
    /// let p = Point::from_tuple((7.0, 8.0));
    /// assert_eq!(p.x, 7.0);
    /// assert_eq!(p.y, 8.0);
    /// ```
    pub fn from_tuple(tuple: (f64, f64)) -> Self {
        Self {
            x: tuple.0,
            y: tuple.1,
        }
    }

    /// 从数组构造
    /// # 示例
    /// ```
    /// use wmts::point::Point;
    /// let p = Point::from_array([9.0, 10.0]);
    /// assert_eq!(p.x, 9.0);
    /// assert_eq!(p.y, 10.0);
    /// ```
    pub fn from_array(arr: [f64; 2]) -> Self {
        Self {
            x: arr[0],
            y: arr[1],
        }
    }
}

impl From<(f64, f64)> for Point {
    /// 从 (f64, f64) 元组创建 Point
    /// # 示例
    /// ```
    /// use wmts::point::Point;
    /// let p: Point = (9.0, 10.0).into();
    /// assert_eq!(p.x, 9.0);
    /// assert_eq!(p.y, 10.0);
    /// ```
    fn from(tuple: (f64, f64)) -> Self {
        Self::from_tuple(tuple)
    }
}

impl From<[f64; 2]> for Point {
    /// 从 [f64; 2] 数组创建 Point
    /// # 示例
    ///
    /// ```
    /// use wmts::point::Point;
    /// let p: Point = [11.0, 12.0].into();
    /// assert_eq!(p.x, 11.0);
    /// assert_eq!(p.y, 12.0);
    /// ```
    fn from(arr: [f64; 2]) -> Self {
        Self::from_array(arr)
    }
}
