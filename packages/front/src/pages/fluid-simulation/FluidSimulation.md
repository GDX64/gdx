# Simulating Fluids on a Grid

A fluid is, at its core, a velocity field: at every point in space, a vector
telling you which way the stuff there is moving. Smoke, water, and air all
obey the same equations — the differences are just in the details we choose
to ignore. What we want is a way to take a velocity field at one instant and
step it forward in time, so it swirls and curls the way real fluid does,
carrying a dye or smoke density along with it.

The technique here is Jos Stam's **Stable Fluids** method, the one made
popular by *GPU Gems* — a grid-based solver that stays stable at any time
step by trading a bit of physical accuracy for unconditional numerical
stability. We'll build it entirely on the CPU, in plain TypeScript, operating
on values stored on a grid.

## The equations we're solving

A fluid's velocity field <latex-math inline>\mathbf{u}(\mathbf{x}, t)</latex-math>
evolves according to the incompressible **Navier-Stokes equations**:

<latex-math>
\frac{\partial \mathbf{u}}{\partial t} = -(\mathbf{u}\cdot\nabla)\mathbf{u} - \frac{1}{\rho}\nabla p + \nu \nabla^2 \mathbf{u} + \mathbf{f}
</latex-math>

<latex-math>
\nabla \cdot \mathbf{u} = 0
</latex-math>

That's a lot in one line, so let's take each piece on its own:

- <latex-math inline>(\mathbf{u}\cdot\nabla)\mathbf{u}</latex-math> is **advection** —
  the field carrying itself along. Velocity doesn't just sit still; it's
  pushed around by its own motion.
- <latex-math inline>\nu \nabla^2 \mathbf{u}</latex-math> is **diffusion** —
  viscosity smoothing the field out, with <latex-math inline>\nu</latex-math>
  the viscosity coefficient.
- <latex-math inline>-\frac{1}{\rho}\nabla p</latex-math> is the **pressure
  term** — pressure pushes fluid from high- to low-pressure regions.
- <latex-math inline>\mathbf{f}</latex-math> is any external **force** we add,
  like a mouse drag or buoyancy.
- <latex-math inline>\nabla \cdot \mathbf{u} = 0</latex-math> is
  **incompressibility**: the field must have zero divergence everywhere,
  meaning fluid can't pile up or appear from nowhere. This is the constraint
  that gives fluid its characteristic swirling, volume-preserving look.

We also carry a scalar **density field** <latex-math inline>d(\mathbf{x},
t)</latex-math> (think smoke or dye concentration) that gets pushed around by
the same velocity field, obeying its own, simpler advection-diffusion
equation:

<latex-math>
\frac{\partial d}{\partial t} = -(\mathbf{u}\cdot\nabla)d + \kappa \nabla^2 d + S
</latex-math>

where <latex-math inline>\kappa</latex-math> is a diffusion rate for the
density and <latex-math inline>S</latex-math> is a source term (e.g. injecting
smoke at a point).

## Stam's trick: split it into steps

Solving all of this at once is hard. Stam's insight was to notice that each
term on the right-hand side is an independent physical process, so instead of
solving the combined PDE we can apply each process **one after another**,
using the output of one step as the input to the next. This is called
**operator splitting**. For velocity, one time step
<latex-math inline>\Delta t</latex-math> becomes four sequential updates:

<latex-math>
\mathbf{u}_0 \xrightarrow{\text{add force}} \mathbf{u}_1 \xrightarrow{\text{advect}} \mathbf{u}_2 \xrightarrow{\text{diffuse}} \mathbf{u}_3 \xrightarrow{\text{project}} \mathbf{u}_4
</latex-math>

The density field goes through the same advect-diffuse pipeline (plus adding
sources), just without the pressure projection step, since density has no
incompressibility constraint.

Each of the four steps is individually well-understood and, crucially, can be
made **unconditionally stable** — no matter how big <latex-math inline>\Delta
t</latex-math> is, the simulation won't blow up. That's the whole appeal of
this method over a naive forward-Euler integrator.

## The grid

Everything lives on a regular 2D grid of cells, <latex-math inline>N \times
N</latex-math>, plus a one-cell border of "ghost" cells used to enforce
boundary conditions. Each cell stores:

- a horizontal velocity component <latex-math inline>u</latex-math>
- a vertical velocity component <latex-math inline>v</latex-math>
- a density value <latex-math inline>d</latex-math>

All of these are stored on the same grid points (a "collocated" grid) — the
simplest choice, and the one Stam uses in the original paper. Cell
<latex-math inline>(i, j)</latex-math> is addressed with the usual row-major
index, and we always keep **two copies** of each field: the value at the
start of the step and the value we're writing into, since every step reads
neighbors that must not have already been updated this step.

## Step 1: Add forces

The simplest step. Given a force field <latex-math inline>\mathbf{f}</latex-math>
(from user input, buoyancy, wind, whatever), Euler-integrate it directly into
the velocity:

<latex-math>
\mathbf{u}_1 = \mathbf{u}_0 + \Delta t\, \mathbf{f}
</latex-math>

Applied per-cell: <latex-math inline>u_{i,j} \mathrel{+}= \Delta t\, f^x_{i,j}</latex-math>
and likewise for <latex-math inline>v</latex-math>. Density sources are added
the same way: <latex-math inline>d_{i,j} \mathrel{+}= \Delta t\, S_{i,j}</latex-math>.

## Step 2: Advection (semi-Lagrangian)

This is the step that makes Stable Fluids *stable*. A naive forward
advection — push each cell's quantity forward along the velocity — blows up
for large time steps, because far-apart cells can end up trying to write to
the same destination or leaving gaps.

Stam instead advects **backward**: for each grid cell, ask *where did the
fluid that is now at this cell come from one step ago?*, then sample the
old field at that location. This is unconditionally stable because it's a
lookup, not a scatter — every cell always gets exactly one value.

Concretely, for a quantity <latex-math inline>q</latex-math> (velocity
component or density) at cell center <latex-math inline>\mathbf{x}_{i,j}</latex-math>:

<latex-math>
\mathbf{x}_{\text{prev}} = \mathbf{x}_{i,j} - \Delta t\, \mathbf{u}(\mathbf{x}_{i,j})
</latex-math>

<latex-math>
q_{i,j}^{\text{new}} = \text{interp}\big(q^{\text{old}}, \mathbf{x}_{\text{prev}}\big)
</latex-math>

<latex-math inline>\mathbf{x}_{\text{prev}}</latex-math> will almost never
land exactly on a grid point, so `interp` is a **bilinear interpolation**
over the four surrounding cells. If
<latex-math inline>\mathbf{x}_{\text{prev}} = (i+s, j+t)</latex-math> with
<latex-math inline>s, t \in [0,1)</latex-math> the fractional offsets, then

<latex-math>
q^{\text{new}}_{i,j} = (1-s)(1-t)\,q_{i,j} + s(1-t)\,q_{i+1,j} + (1-s)t\,q_{i,j+1} + st\,q_{i+1,j+1}
</latex-math>

Positions that land outside the grid get clamped to the last valid cell,
which is what gives us free boundary handling for advection.

Velocity advects itself (using its own field to trace backward), and density
advects using the freshly-updated velocity field from this same step.

## Step 3: Diffusion (implicit solve)

Diffusion spreads a quantity toward its neighbors' average, governed by
<latex-math inline>\partial q/\partial t = \nu \nabla^2 q</latex-math>. An
explicit (forward-time) discretization of this is unstable for large
<latex-math inline>\nu \Delta t</latex-math>, so instead we discretize
**implicitly** — solve for the *new* field such that stepping it backward
in time recovers the old one:

<latex-math>
q^{\text{old}}_{i,j} = q^{\text{new}}_{i,j} - \nu \Delta t \left( q^{\text{new}}_{i-1,j} + q^{\text{new}}_{i+1,j} + q^{\text{new}}_{i,j-1} + q^{\text{new}}_{i,j+1} - 4\,q^{\text{new}}_{i,j} \right)
</latex-math>

which rearranges to, letting <latex-math inline>a = \nu \Delta t</latex-math>:

<latex-math>
(1 + 4a)\,q^{\text{new}}_{i,j} - a\sum_{\text{neighbors}} q^{\text{new}} = q^{\text{old}}_{i,j}
</latex-math>

This is a linear system — one equation per grid cell, all coupled to their
neighbors. We don't need to build or invert a matrix explicitly: because the
system is **diagonally dominant** (the <latex-math inline>1+4a</latex-math>
coefficient dominates the four <latex-math inline>-a</latex-math> neighbor
terms), a simple iterative method converges quickly. We use **Gauss-Seidel
relaxation**: repeatedly sweep the grid, at each cell solving for
<latex-math inline>q_{i,j}^{\text{new}}</latex-math> using the *already
updated* neighbor values from earlier in the same sweep,

<latex-math>
q^{\text{new}}_{i,j} \leftarrow \frac{q^{\text{old}}_{i,j} + a\left(q_{i-1,j} + q_{i+1,j} + q_{i,j-1} + q_{i,j+1}\right)}{1 + 4a}
</latex-math>

for some fixed number of iterations (20 is Stam's rule of thumb — each
iteration doesn't need to fully converge, since we're re-solving from scratch
every time step anyway).

## Step 4: Projection (making it incompressible)

After advection and diffusion, the velocity field is generally no longer
divergence-free — it may have regions where flow is expanding or converging,
which real incompressible fluid can't do. Projection removes this.

The key tool is the **Helmholtz-Hodge decomposition**: any vector field
<latex-math inline>\mathbf{w}</latex-math> can be split uniquely into a
divergence-free part and a curl-free (gradient) part,

<latex-math>
\mathbf{w} = \mathbf{u} + \nabla p, \qquad \nabla \cdot \mathbf{u} = 0
</latex-math>

We have <latex-math inline>\mathbf{w}</latex-math> (our post-diffusion
velocity) and want to recover its divergence-free component
<latex-math inline>\mathbf{u}</latex-math>. Taking the divergence of both
sides eliminates <latex-math inline>\mathbf{u}</latex-math> and leaves a
**Poisson equation** for the pressure:

<latex-math>
\nabla^2 p = \nabla \cdot \mathbf{w}
</latex-math>

Once <latex-math inline>p</latex-math> is known, subtracting its gradient
gives the divergence-free field we want:

<latex-math>
\mathbf{u} = \mathbf{w} - \nabla p
</latex-math>

On the grid, divergence at cell <latex-math inline>(i,j)</latex-math> is
estimated with central differences over a cell of size
<latex-math inline>h</latex-math> (we take <latex-math inline>h=1</latex-math>,
one grid unit):

<latex-math>
(\nabla \cdot \mathbf{w})_{i,j} = \frac{w^x_{i+1,j} - w^x_{i-1,j} + w^y_{i,j+1} - w^y_{i,j-1}}{2}
</latex-math>

and the discrete Poisson equation is, again, a per-cell linear system solved
with Gauss-Seidel — this time with no dominant diagonal term to speed
convergence, so more iterations (Stam again suggests around 20) are used:

<latex-math>
p_{i,j} \leftarrow \frac{p_{i-1,j} + p_{i+1,j} + p_{i,j-1} + p_{i,j+1} - (\nabla\cdot\mathbf{w})_{i,j}}{4}
</latex-math>

Finally the pressure gradient is subtracted off with central differences:

<latex-math>
u^x_{i,j} = w^x_{i,j} - \frac{p_{i+1,j} - p_{i-1,j}}{2}, \qquad u^y_{i,j} = w^y_{i,j} - \frac{p_{i,j+1} - p_{i,j-1}}{2}
</latex-math>

The result is divergence-free (up to the residual of the Gauss-Seidel solve),
and it's this projected field that produces the swirly, vortex-preserving
look of real fluid — it's also the step responsible for most of the
per-frame cost, since it needs the most solver iterations.

## Boundary conditions

The grid has walls, and cells need to know what to do at the edge. We
surround the <latex-math inline>N\times N</latex-math> interior with a ring
of ghost cells and, after every step that can touch a boundary, set the
ghost values from their interior neighbor so that:

- **velocity** reflects to enforce a no-flow wall: the component
  perpendicular to a wall is negated (<latex-math inline>u_{0,j} =
  -u_{1,j}</latex-math> at a left wall), while the parallel component copies
  through unchanged, giving a free-slip condition.
- **density and pressure** simply copy the nearest interior cell
  (<latex-math inline>d_{0,j} = d_{1,j}</latex-math>), a zero-gradient
  ("do nothing at the wall") condition.
- corner ghost cells are set to the average of their two edge neighbors.

## Putting a full step together

One simulation frame, advancing both velocity and density by
<latex-math inline>\Delta t</latex-math>, runs in this order:

1. **Add forces** to velocity (user input, buoyancy, wind).
2. **Diffuse** velocity (Gauss-Seidel on the implicit viscosity system), then
   **project** to remove divergence — diffusion is done first because it can
   introduce divergence that projection then needs to clean up anyway.
3. **Advect** velocity through itself (semi-Lagrangian backtrace using the
   *pre-advection* velocity field), then **project** again — advection can
   reintroduce divergence, so we clean up a second time.
4. **Add sources** to density, then **diffuse** density, then **advect**
   density through the final, divergence-free velocity field.

This order — force, diffuse, project, advect, project — is exactly Stam's
`Vstep`/`Dstep` structure, and each stage only ever depends on the fully
completed output of the stage before it, which is what makes it safe to
implement as a straight sequential pipeline over plain arrays with no
hidden coupling between steps.

## Seeing it move

All of the above — add force, diffuse, project, advect, project, diffuse
density, advect density — runs once per frame below. Click and drag on the
canvas to inject density and push velocity into the grid; the panel lets you
tune viscosity, diffusion, the time step, and the solver iteration count live.

<fluid-simulation-example></fluid-simulation-example>
