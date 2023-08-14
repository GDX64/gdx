use segment_tree::{
    ops::{Commutative, Identity, Operation},
    SegmentPoint,
};
use wasm_bindgen::JsValue;
use web_sys::CanvasRenderingContext2d;

pub struct Chart {
    pub view_range: (usize, usize),
    pub scale_x: LinScale,
    pub scale_y: LinScale,
    pub ctx: CanvasRenderingContext2d,
    pub canvas_size: (u32, u32),
    pub view_data: Vec<(f64, MinMax)>,
    pub min_max_tree: MinMaxTree,
    pub avg_recalc_time: f64,
    size_updated: bool,
    curr_step: usize,
}

impl Chart {
    pub fn build(base_data: &[f64], ctx: CanvasRenderingContext2d) -> Chart {
        let base = base_data
            .iter()
            .map(|v| MinMax::same(*v))
            .collect::<Vec<_>>();
        let min_max_tree = MinMaxTree::build(base, MinMaxOp);
        Chart {
            view_range: (0, base_data.len() / 2),
            scale_x: LinScale::new((0.0, 5.0), (0.0, 300.0)),
            scale_y: LinScale::new((0.0, 5.0), (0.0, 100.0)),
            ctx,
            canvas_size: (300, 150),
            view_data: vec![],
            min_max_tree,
            curr_step: 1,
            size_updated: false,
            avg_recalc_time: 0.0,
        }
    }

    fn dpr() -> f64 {
        web_sys::window()
            .map(|win| win.device_pixel_ratio())
            .unwrap_or(1.0)
    }

    pub fn query_range<'a>(&'a self) -> MinMax {
        let (min, max) = self.view_range;
        self.min_max_tree.query(min, max)
    }

    pub fn get_size(&self) -> usize {
        self.min_max_tree.len()
    }

    pub fn adjust_canvas(&mut self) -> Option<()> {
        self.view_range = (
            self.view_range.0,
            self.view_range.1.min(self.min_max_tree.len()).max(10),
        );
        let canvas = self.ctx.canvas()?;
        let width = canvas.client_width() as u32;
        let height = canvas.client_height() as u32;
        let dpr = Self::dpr();
        self.canvas_size = (((width as f64) * dpr) as u32, (height as f64 * dpr) as u32);
        let (width, height) = self.canvas_size;
        canvas.set_width(width);
        canvas.set_height(height);
        Some(())
    }

    fn calc_base_data(&self) -> (impl ExactSizeIterator<Item = MinMax> + '_, usize) {
        let (min, max) = self.view_range;
        let max_items_on_screen = 300.min(max - min);
        let range = max - min;
        let step = range / max_items_on_screen;
        let iter = (0..max_items_on_screen).map(move |i| {
            self.min_max_tree
                .query(min + i * step, min + (i + 1) * step)
        });
        (iter, step)
    }

    pub fn recalc(&mut self) {
        let start_time = js_sys::Date::now();
        if !self.size_updated {
            self.adjust_canvas();
            self.size_updated = true;
        }
        let (min, max) = self.view_range;
        let canvas_size = self.canvas_size.clone();
        let MinMax { min, max } = self.min_max_tree.query(min, max);
        let (data, step) = self.calc_base_data();
        let scale_y = LinScale::new((max, min), (5.0, canvas_size.1 as f64 - 5.0));
        let scale_x = LinScale::new((0 as f64, data.len() as f64), (0.0, canvas_size.0 as f64));
        self.view_data = data
            .enumerate()
            .map(|(i, min_max)| {
                let min = scale_y.apply(min_max.min);
                let max = scale_y.apply(min_max.max);

                let x = scale_x.apply(i as f64);
                (x, MinMax { min, max })
            })
            .collect();
        self.scale_x = scale_x;
        self.scale_y = scale_y;
        self.curr_step = step;
        let end_time = js_sys::Date::now();
        self.avg_recalc_time = (end_time - start_time) * 0.1 + self.avg_recalc_time * 0.9;
    }

    pub fn draw(&self) {
        let ctx = &self.ctx;
        ctx.clear_rect(
            0.0,
            0.0,
            self.canvas_size.0 as f64,
            self.canvas_size.1 as f64,
        );
        ctx.begin_path();
        let val = JsValue::from_str("red");
        ctx.set_stroke_style(&val);
        for data_point in self.view_data.iter() {
            ctx.rect(
                data_point.0,
                data_point.1.max,
                1.0,
                (data_point.1.max - data_point.1.min).abs(),
            );
        }

        ctx.stroke();
    }

    pub fn zoom(&mut self, delta: i32, center_point: f64) {
        let (min, max) = self.view_range;
        let point_index =
            ((self.scale_x.apply_inv(center_point * Self::dpr()) as usize) * self.curr_step) + min;
        let point_index = point_index.max(0).min(self.min_max_tree.len()) as i32;
        let min = min as i32;
        let max = max as i32;
        let range = max - min;
        let range_left = point_index - min;
        let range_right = max - point_index;
        let delta_left = (delta * range_left) / 100;
        let delta_right = (delta * range_right) / 100;
        let new_max = (max + delta_right)
            .max(point_index + 1)
            .min(self.get_size() as i32);
        let new_min = (min - delta_left).max(0).min(point_index - 1);
        if range + delta_left + delta_right < 10_000 {
            return;
        }
        self.view_range.0 = new_min.max(0) as usize;
        self.view_range.1 = new_max.min(self.get_size() as i32) as usize;
        self.recalc();
    }

    pub fn slide(&mut self, delta: i32) {
        let view_range = &mut self.view_range;
        let gap = (view_range.1 - view_range.0) as i32;
        let min = view_range.0 as i32 + (self.curr_step as i32) * delta;
        let min = min.max(0);
        let max = min + gap;
        if max > self.min_max_tree.len() as i32 {
            view_range.0 = self.min_max_tree.len() - gap as usize;
            view_range.1 = self.min_max_tree.len();
        } else {
            view_range.0 = min as usize;
            view_range.1 = max as usize;
        }
        self.recalc();
    }
}

#[derive(PartialEq)]
pub struct LinScale {
    k: f64,
    alpha: f64,
}

impl LinScale {
    pub fn new(domain: (f64, f64), range: (f64, f64)) -> LinScale {
        let alpha = (range.1 - range.0) / (domain.1 - domain.0);
        let k = range.0 - alpha * domain.0;
        LinScale { k, alpha }
    }

    pub fn apply(&self, x: f64) -> f64 {
        self.alpha * x + self.k
    }

    pub fn apply_inv(&self, y: f64) -> f64 {
        (y - self.k) / self.alpha
    }
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub struct MinMax {
    pub min: f64,
    pub max: f64,
}

impl MinMax {
    fn new(min: f64, max: f64) -> MinMax {
        MinMax { min, max }
    }

    fn same(val: f64) -> MinMax {
        MinMax::new(val, val)
    }
}

pub struct MinMaxOp;

impl Operation<MinMax> for MinMaxOp {
    fn combine(&self, a: &MinMax, b: &MinMax) -> MinMax {
        MinMax {
            min: a.min.min(b.min),
            max: a.max.max(b.max),
        }
    }
}

impl Commutative<MinMax> for MinMaxOp {}

impl Identity<MinMax> for MinMaxOp {
    fn identity(&self) -> MinMax {
        MinMax {
            min: f64::MAX,
            max: f64::MIN,
        }
    }
}

pub type MinMaxTree = SegmentPoint<MinMax, MinMaxOp>;

#[cfg(test)]
mod test {
    use segment_tree::SegmentPoint;

    use crate::{MinMax, MinMaxOp};

    #[test]
    fn test_segment_tree() {
        let example_minmax_vec = vec![
            MinMax::same(1.0),
            MinMax::same(2.0),
            MinMax::same(3.0),
            MinMax::same(4.0),
            MinMax::same(5.0),
            MinMax::same(6.0),
        ];

        let tree = SegmentPoint::build(example_minmax_vec, MinMaxOp);
        assert_eq!(tree.query(0, 6), MinMax::new(1.0, 6.0));
    }
}
