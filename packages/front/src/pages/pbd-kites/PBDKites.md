# How the Kites Are Drawn

The kites drifting around the top of my homepage are not animated by hand and they
are not following a scripted path. Each one is a small, self-contained simulation,
and pulling it apart turns out to touch three quite different corners of graphics
programming:

- a bit of **control theory** — filtered noise that makes the sail drift like it is
  caught in a real, gusty wind, and snaps to attention when you grab it;
- a hand-rolled **3D renderer** that projects the sail into the page using nothing
  but the 2D canvas API;
- and a dash of **Position Based Dynamics** for the ropes, so they sag, swing, and
  trail behind the kite the way string actually does.

This post walks through all three, in the order the data flows: first we decide
where the kite *is*, then we figure out how to *draw* it, and finally we hang the
ropes off it.

## Steering a kite with filtered noise

A kite that moved in a clean sine wave would look like a screensaver. Real kites
are pushed around by wind, which is **noisy but correlated**: it wanders slowly,
not frame-to-frame randomly. So the motion starts from white noise and shapes it
into something that *feels* like wind.

Each frame the kite draws a fresh sample of Gaussian white noise — a number with no
memory of the last one:

<latex-math>
n \sim \mathcal{N}(0, 1)
</latex-math>

generated with the Box–Muller transform. White noise on its own is useless as
wind: it jitters at every frequency at once. To tame it I run it through a
**low-pass filter**, which keeps the slow components and throws away the fast
jitter, leaving a signal that drifts gently. That drift drives the kite's
horizontal and vertical position.

The filters here are **biquads** — second-order IIR (infinite impulse response)
filters, the same workhorse used all over audio. A biquad computes each output
sample from the two previous inputs and the two previous outputs:

<latex-math>
y[n] = b_0\,x[n] + b_1\,x[n-1] + b_2\,x[n-2] - a_1\,y[n-1] - a_2\,y[n-2]
</latex-math>

The feedback terms (the <latex-math inline>y[n-1]</latex-math>,
<latex-math inline>y[n-2]</latex-math>) are what make it *infinite* impulse
response: every output depends on the entire past, which is exactly what gives the
filter its smooth, springy memory. The coefficients
<latex-math inline>a_k, b_k</latex-math> are derived from a single **cutoff
frequency** <latex-math inline>\omega = 2\pi f_c / f_s</latex-math> — the boundary
between "slow enough to keep" and "fast enough to discard." Picking a low cutoff
for the wind gives that lazy, meandering drift.

The mouse is wired in through the *opposite* filter. When you grab a kite, your
pointer movement is fed through a **high-pass filter**, which does the reverse: it
keeps the sudden, fast motion and discards the slow part. The result is that a
quick flick produces a sharp tug on the kite that decays away on its own, while
slowly dragging the cursor barely registers. Low-passed noise for the ambient
sway, high-passed input for the snappy response — and the two are simply summed:

<latex-math>
x_{\text{kite}} = \underbrace{g_{\text{low}}\,\text{LP}(n)}_{\text{wind drift}} + \underbrace{g_{\text{high}}\,\text{HP}(\text{mouse})}_{\text{your tug}} + x_0
</latex-math>

The chart below is the live signal path. Every frame a fresh white-noise sample
(grey) is pushed through the low-pass filter to produce the slow **wind drift**
(blue). Move your pointer anywhere on the page and its screen-relative position
(purple, −1 at the left edge, +1 at the right) is pushed through the high-pass
filter; its high-frequency tug is then added to the wind drift to give the
**final movement** (orange) that actually steers the kite. That sum spikes when you
move quickly and relaxes back toward the wind drift when you hold still.

<filter-response-example></filter-response-example>

The same filtered signals also feed the sail's **orientation**, so when the kite
lurches sideways it also banks into the turn. None of this is a physical wind
model — it is just signal processing standing in for one, and it is remarkably
convincing for how little code it takes.

## Drawing a 3D kite with a 2D API

The sail is a genuinely three-dimensional object: four triangular panels meeting at
a slightly raised center, free to rotate in space. But the canvas only gives us 2D
primitives. So the renderer reimplements the **model → view → projection** pipeline
that a GPU would normally run, by hand, in a few lines of matrix math.

Each vertex starts in the kite's own local space and is pushed through three
transforms:

<latex-math>
\mathbf{v}_{\text{clip}} = \mathbf{P}\,\mathbf{V}\,\mathbf{M}\,\mathbf{v}_{\text{local}}
</latex-math>

The **model matrix** <latex-math inline>\mathbf{M}</latex-math> places and rotates
the kite in the world (this is where the filtered motion from the previous section
lands). The **view matrix** <latex-math inline>\mathbf{V}</latex-math> — built with
a standard `lookAt` — expresses everything relative to a camera that slowly orbits
the scene. The **projection matrix** <latex-math inline>\mathbf{P}</latex-math> is a
perspective frustum, which is the part that makes distant kites smaller.

After the projection we are in **clip space**, and the perspective divide leaves
**normalized device coordinates** in <latex-math inline>[-1, 1]</latex-math>. One
last affine map rescales that square to actual pixels:

<latex-math>
x_{\text{screen}} = \frac{x_{\text{ndc}} + 1}{2}\,W, \qquad y_{\text{screen}} = \frac{1 - y_{\text{ndc}}}{2}\,H
</latex-math>

The <latex-math inline>y</latex-math> flip is there because clip space points up
while the canvas counts pixels downward. Now every vertex is just a 2D point, and
we can hand the resulting polygons to the canvas.

Two details make it look right. First, with no depth buffer available, overlapping
kites are sorted **back-to-front by their distance from the camera** and drawn in
that order — the **painter's algorithm**. Whatever is nearest gets drawn last and
covers what is behind it. Second, the panels are not stroked with crisp lines but
with [rough.js](https://roughjs.com), which adds a deliberate hand-drawn wobble, so
the whole thing reads as a sketch rather than a wireframe.

The sail below runs that exact pipeline on a single kite. **Drag** to spin it and
watch the four panels re-project frame by frame; the **camera distance** slider
moves the perspective camera nearer or farther — up close the frustum stretches the
near panels and shrinks the far ones, while pulling it back flattens the sail toward
a parallel projection. Turn **roughness** up to thicken the hand-drawn wobble, or
switch on **projected vertices** to see the five points after the full
<latex-math inline>\mathbf{P}\,\mathbf{V}\,\mathbf{M}</latex-math> transform and the
pixel remap have collapsed them onto the canvas.

<kite-projection-example></kite-projection-example>

## Hanging the ropes: Position Based Dynamics

The ropes trailing each kite are the part that really sells the illusion of weight.
Each one is a chain of nodes, simulated every frame with **Position Based Dynamics**
(PBD) — a technique that is both simpler and far more stable than the spring-force
simulation you might reach for first.

The naive approach makes every rope segment a stiff spring and integrates the
forces. The trouble is that a stiff spring over a discrete time step overshoots,
which produces an even larger force next step, and the simulation explodes. PBD
sidesteps the whole problem by working **directly in position space**. One step is:

1. **Integrate.** Apply gravity (and wind) to each node, moving it as if it were
   free.
2. **Project constraints.** For each segment, *move the two nodes* the minimum
   amount needed to restore its rest length — no forces involved.
3. **Recover velocity.** Set each node's velocity to its actual change in position,
   <latex-math inline>\mathbf{v} = (\mathbf{x}' - \mathbf{x})/\Delta t</latex-math>.

Because velocity is read back *after* the constraints have moved things, a
constraint can yank a node hard without ever producing a runaway force. Stiffness
becomes a matter of how many times you iterate the projection, not how large a
constant you dare to use.

The only constraint a rope needs is a **distance constraint**: keep neighbouring
nodes a fixed segment length <latex-math inline>l_0</latex-math> apart. With
<latex-math inline>\mathbf{d} = \mathbf{x}_{i+1} - \mathbf{x}_i</latex-math> and
<latex-math inline>\hat{\mathbf{d}} = \mathbf{d}/\lVert\mathbf{d}\rVert</latex-math>,
the leftover error <latex-math inline>\lVert\mathbf{d}\rVert - l_0</latex-math> is
split between the two nodes in inverse proportion to their mass:

<latex-math>
\mathbf{x}_i \mathrel{+}= \frac{m_{i+1}}{m_i + m_{i+1}}\,(\lVert\mathbf{d}\rVert - l_0)\,\hat{\mathbf{d}}, \qquad
\mathbf{x}_{i+1} \mathrel{-}= \frac{m_i}{m_i + m_{i+1}}\,(\lVert\mathbf{d}\rVert - l_0)\,\hat{\mathbf{d}}
</latex-math>

The displacements are equal and opposite, so momentum is conserved and the
constraint never drifts the rope sideways.

In the demo below the dark node is the rope's anchor — drag anywhere to move it and
watch the chain follow. **Gravity** sets the downward pull; **Stiffness** is the
number of projection passes per frame: turn it down and the rope visibly stretches,
turn it up and it behaves like an inextensible string.

<pbd-rope-example></pbd-rope-example>

### Pinning ends with infinite mass

There is a wonderfully cheap way to **fix** a node: give it an enormous mass. The
mass-weighting term then collapses so that the free neighbour absorbs the entire
correction and the pinned node never moves:

<latex-math>
\frac{m_{\text{fixed}}}{m_{\text{free}} + m_{\text{fixed}}} \to 1, \qquad \frac{m_{\text{free}}}{m_{\text{free}} + m_{\text{fixed}}} \to 0
</latex-math>

That is exactly how each rope attaches to its kite: the first node is teleported to
the sail's anchor point every frame and flagged with a huge mass, so the rest of
the chain hangs from it. The same mechanism pins the far end of the long control
line to a fixed point in the sky.

You can tie **both** ends the same way. Below, the right-hand node is nailed to a
fixed point and the left node follows your cursor — drag it and the rope hangs
between the two pins as a catenary. Pull the ends apart past the rope's natural
length and the chain snaps straight, every segment fighting to keep its rest
length.

<pbd-rope-example tied></pbd-rope-example>

A couple of finishing touches keep it calm: each frame is split into a few
**substeps** so the unconstrained integration drifts less before the constraints
correct it, and a small velocity-dependent **drag** bleeds off energy so the rope
settles into a hang instead of swinging forever.

## Putting it together

So each kite in the header is really three little systems stacked on top of each
other. Filtered noise decides where the sail drifts and how it banks. A
by-hand model–view–projection pipeline flattens that 3D sail onto the 2D canvas,
sorted back-to-front and stroked with a sketchy line. And a handful of PBD ropes,
re-pinned to the sail every frame, trail behind it under gravity and wind.

None of the pieces is individually large — a biquad is six multiplies, the renderer
is a few matrix products, a rope is move-the-nodes-and-project. But stacked
together they turn a static doodle into something that genuinely feels like it is
flying.
