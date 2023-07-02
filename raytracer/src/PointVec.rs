use std::ops::{Add, Mul, Sub};

#[derive(Debug, Clone, Copy)]
pub struct Point {
    x: f64,
    y: f64,
    z: f64,
    w: f64,
}

pub trait TupleLike: Sized {
    fn get_x(&self) -> f64;
    fn get_y(&self) -> f64;
    fn get_z(&self) -> f64;
    fn get_w(&self) -> f64;

    fn from_tuple(t: (f64, f64, f64, f64)) -> Self;

    fn normalize(&self) -> Self {
        let mag = self.magnitude();
        Self::from_tuple((
            self.get_x() / mag,
            self.get_y() / mag,
            self.get_z() / mag,
            self.get_w() / mag,
        ))
    }

    fn scale(&self, scalar: f64) -> Self {
        Self::from_tuple((
            self.get_x() * scalar,
            self.get_y() * scalar,
            self.get_z() * scalar,
            self.get_w() * scalar,
        ))
    }

    fn cross(&self, other: &Self) -> Self {
        Self::from_tuple((
            self.get_y() * other.get_z() - self.get_z() * other.get_y(),
            self.get_z() * other.get_x() - self.get_x() * other.get_z(),
            self.get_x() * other.get_y() - self.get_y() * other.get_x(),
            0.0,
        ))
    }

    fn convert<T: TupleLike>(&self) -> T {
        T::from_tuple((self.get_x(), self.get_y(), self.get_z(), self.get_w()))
    }

    fn magnitude(&self) -> f64 {
        (self.get_x() * self.get_x()
            + self.get_y() * self.get_y()
            + self.get_z() * self.get_z()
            + self.get_w() * self.get_w())
        .sqrt()
    }

    fn dot(&self, other: &Self) -> f64 {
        self.get_x() * other.get_x()
            + self.get_y() * other.get_y()
            + self.get_z() * other.get_z()
            + self.get_w() * other.get_w()
    }

    fn add<T: TupleLike>(&self, other: &T) -> Self {
        Self::from_tuple((
            self.get_x() + other.get_x(),
            self.get_y() + other.get_y(),
            self.get_z() + other.get_z(),
            self.get_w() + other.get_w(),
        ))
    }

    fn sub<T: TupleLike>(&self, other: &T) -> Self {
        Self::from_tuple((
            self.get_x() - other.get_x(),
            self.get_y() - other.get_y(),
            self.get_z() - other.get_z(),
            self.get_w() - other.get_w(),
        ))
    }

    fn eq(&self, other: &Self) -> bool {
        (self.get_x() - other.get_x()).abs() < EPS
            && (self.get_y() - other.get_y()).abs() < EPS
            && (self.get_z() - other.get_z()).abs() < EPS
            && (self.get_w() - other.get_w()).abs() < EPS
    }
}

impl Point {
    fn new(x: f64, y: f64, z: f64) -> Self {
        Point { x, y, z, w: 1.0 }
    }
}

impl TupleLike for Point {
    fn from_tuple(t: (f64, f64, f64, f64)) -> Self {
        Point {
            x: t.0,
            y: t.1,
            z: t.2,
            w: t.3,
        }
    }

    fn get_x(&self) -> f64 {
        self.x
    }

    fn get_y(&self) -> f64 {
        self.y
    }

    fn get_z(&self) -> f64 {
        self.z
    }

    fn get_w(&self) -> f64 {
        self.w
    }
}

const EPS: f64 = 1e-6;

impl PartialEq for Point {
    fn eq(&self, other: &Self) -> bool {
        TupleLike::eq(self, other)
    }
}

impl Add<V3D> for Point {
    type Output = Self;
    fn add(self, rhs: V3D) -> Self::Output {
        TupleLike::add(&self, &rhs)
    }
}

impl Sub for Point {
    type Output = V3D;
    fn sub(self, rhs: Self) -> Self::Output {
        TupleLike::sub(&self, &rhs).convert()
    }
}

impl Sub<V3D> for Point {
    type Output = Self;
    fn sub(self, rhs: V3D) -> Self::Output {
        TupleLike::sub(&self, &rhs)
    }
}

#[derive(Debug, Clone, Copy)]
pub struct V3D {
    x: f64,
    y: f64,
    z: f64,
}

impl V3D {
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        V3D { x, y, z }
    }
}

impl Add for V3D {
    type Output = Self;
    fn add(self, rhs: Self) -> Self::Output {
        TupleLike::add(&self, &rhs)
    }
}

impl Sub for V3D {
    type Output = Self;
    fn sub(self, rhs: Self) -> Self::Output {
        TupleLike::sub(&self, &rhs)
    }
}

impl Mul<f64> for V3D {
    type Output = Self;
    fn mul(self, rhs: f64) -> Self::Output {
        self.scale(rhs)
    }
}

impl Mul for V3D {
    type Output = f64;
    fn mul(self, rhs: Self) -> Self::Output {
        self.dot(&rhs)
    }
}

impl PartialEq for V3D {
    fn eq(&self, other: &Self) -> bool {
        TupleLike::eq(self, other)
    }
}

impl TupleLike for V3D {
    fn get_x(&self) -> f64 {
        self.x
    }

    fn get_y(&self) -> f64 {
        self.y
    }

    fn get_z(&self) -> f64 {
        self.z
    }

    fn get_w(&self) -> f64 {
        0.0
    }

    fn from_tuple(t: (f64, f64, f64, f64)) -> Self {
        V3D {
            x: t.0,
            y: t.1,
            z: t.2,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn test_dot_product() {
        let a = V3D::new(1.0, 2.0, 3.0);
        let b = V3D::new(2.0, 3.0, 4.0);
        assert_eq!(a * b, 20.0);
    }

    #[test]
    fn test_sum_vec_and_point() {
        let a = V3D::new(1.0, 2.0, 3.0);
        let b = Point::new(2.0, 3.0, 4.0);
        let result = b + a;
        assert_eq!(result, Point::new(3.0, 5.0, 7.0));
    }

    #[test]
    fn sub_points() {
        let a = Point::new(1.0, 2.0, 3.0);
        let b = Point::new(2.0, 3.0, 4.0);
        let result = a - b;
        assert_eq!(result, V3D::new(-1.0, -1.0, -1.0));
    }

    #[test]
    fn cross_product() {
        let a = V3D::new(1.0, 2.0, 3.0);
        let b = V3D::new(2.0, 3.0, 4.0);
        let result = a.cross(&b);
        assert_eq!(result, V3D::new(-1.0, 2.0, -1.0));
    }
}
