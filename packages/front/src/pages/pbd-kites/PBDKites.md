# Flying Kites with Position Based Dynamics

The kites drifting around the top of my homepage are not animated by hand and
they are not following a scripted path. Each one is a little physical object: a
rigid sail pushed around by filtered noise, trailing a set of **ropes** that are
simulated, node by node, every frame. The ropes are what sell the illusion —
they sag under gravity, snap taut when the kite lurches, and lag behind its
motion the way a real string would. All of that comes from one compact idea
called **Position Based Dynamics**.

This post is about that idea: what PBD is, why it is so well behaved compared to
the force-integration you might reach for first, and how the rope hanging off
each kite is actually put together.

## The problem with integrating forces

The textbook way to simulate a particle is to track its position and velocity and
push them forward with the forces acting on it:

<latex-math>
\mathbf{v} \mathrel{+}= \frac{\mathbf{F}}{m}\,\Delta t, \qquad \mathbf{x} \mathrel{+}= \mathbf{v}\,\Delta t
</latex-math>

This is fine for a single particle in free fall. It stops being fine the moment
you want **constraints** — "these two nodes must stay a fixed distance apart,"
which is exactly what a rope is. The classic approach turns each constraint into a
stiff spring: a force proportional to how far the constraint is violated. Make the
spring weak and the rope stretches like elastic; make it stiff and the
integrator explodes, because a large force over a discrete time step overshoots,
which produces an even larger force on the next step. You end up babysitting
spring constants and shrinking the time step until things are merely stable rather
than correct.

## The PBD trick: skip the forces, move the positions

Position Based Dynamics sidesteps the whole instability by working **directly in
position space**. Instead of asking "what force would pull these nodes back to the
right distance," it just *moves the nodes there*. The loop for one step is:

1. **Integrate unconstrained.** Apply gravity (and any external force) to each
   node's velocity, then move each node as if no constraints existed.
2. **Project constraints.** For every constraint, displace the nodes the minimum
   amount needed to satisfy it exactly. Repeat over all constraints.
3. **Recover velocity.** Set each node's new velocity to be its actual change in
   position over the step, <latex-math inline>\mathbf{v} = (\mathbf{x}' - \mathbf{x})/\Delta t</latex-math>.

The last step is the clever part. Velocity is never integrated against a spring
force — it is **derived after the fact** from how far each node actually moved
once the constraints had their say. A constraint can yank a node halfway across
the screen and the resulting velocity is still bounded and sensible, because it is
just a finite displacement divided by <latex-math inline>\Delta t</latex-math>.
There is no stiff force to blow up. Stiffness becomes a question of *how many times
you iterate* the projection, not how large a constant you dare to use.

In the demo below, the dark node is the rope's anchor — drag anywhere in the
canvas to move it and watch the chain follow. The **Gravity** slider changes the
constant downward pull, and **Stiffness** controls how many times the constraints
are projected per frame: turn it down and the rope visibly stretches, turn it up
and it behaves like an inextensible string.

<pbd-rope-example></pbd-rope-example>

## The distance constraint

A rope is just a chain of nodes joined by **distance constraints**: node
<latex-math inline>i</latex-math> and node <latex-math inline>i+1</latex-math> want
to stay exactly one segment length <latex-math inline>l_0</latex-math> apart.
Given their current positions the constraint function is

<latex-math>
C(\mathbf{x}_i, \mathbf{x}_{i+1}) = \lVert \mathbf{x}_{i+1} - \mathbf{x}_i \rVert - l_0
</latex-math>

and we want to nudge both nodes so that <latex-math inline>C = 0</latex-math>. The
correction is along the line joining them. Writing
<latex-math inline>\mathbf{d} = \mathbf{x}_{i+1} - \mathbf{x}_i</latex-math> and
<latex-math inline>\hat{\mathbf{d}} = \mathbf{d}/\lVert\mathbf{d}\rVert</latex-math>,
the total error to remove is
<latex-math inline>\lVert\mathbf{d}\rVert - l_0</latex-math>, and we split it
between the two nodes **in inverse proportion to their mass** so that a heavy node
moves less than a light one:

<latex-math>
\mathbf{x}_i \mathrel{+}= \frac{m_{i+1}}{m_i + m_{i+1}}\,(\lVert\mathbf{d}\rVert - l_0)\,\hat{\mathbf{d}}
</latex-math>

<latex-math>
\mathbf{x}_{i+1} \mathrel{-}= \frac{m_i}{m_i + m_{i+1}}\,(\lVert\mathbf{d}\rVert - l_0)\,\hat{\mathbf{d}}
</latex-math>

Conservation of momentum falls out for free: the mass-weighted displacements are
equal and opposite, so the constraint never injects net translation. This is
exactly the projection step in the code — each segment is visited in turn and its
two endpoints are slid toward or away from each other along
<latex-math inline>\hat{\mathbf{d}}</latex-math>.

## Pinning nodes with infinite mass

There is a beautifully cheap way to **fix** a node in place using the same
mass-weighting. Give it an enormous mass — effectively infinite — and the
distance constraint's weighting term collapses:

<latex-math>
\frac{m_{\text{fixed}}}{m_{\text{free}} + m_{\text{fixed}}} \to 1, \qquad \frac{m_{\text{free}}}{m_{\text{free}} + m_{\text{fixed}}} \to 0
</latex-math>

so the free neighbour absorbs the entire correction and the pinned node does not
budge. That is precisely how each rope is attached to its kite. Every frame, the
first node of the rope is teleported to the kite's anchor point in world space and
flagged with a huge fixed mass; the constraint solver then treats it as an
immovable boundary that the rest of the chain hangs from. The same mechanism pins
the far end of the long control line, so the kite is effectively tethered to a
point in the sky.

## Substepping for stability

Even without stiff forces there is one more knob that matters: the size of the
time step. Rather than projecting constraints once over a full frame, the rope
splits each frame into several **substeps** and runs the whole integrate-and-project
cycle on each one:

<latex-math>
\Delta t_{\text{sub}} = \frac{\Delta t}{N_{\text{substeps}}}
</latex-math>

Smaller steps mean the unconstrained integration drifts less before the
constraints get a chance to correct it, so the rope converges to its rest shape
faster and with less residual stretch — at a roughly linear cost. The kite ropes
use a handful of substeps per frame, which is plenty to keep a chain of a few
dozen nodes looking taut.

## A touch of drag

A pure distance-constrained chain will swing forever; real string loses energy to
the air. After velocities are recovered from the position change, each node gets a
small **velocity-dependent drag** subtracted off, scaled by its own speed so that
fast motion is damped harder than slow drift. It is a single extra line in the
velocity-update pass, but it is the difference between a rope that jitters
perpetually and one that settles into a calm hang and then trails gently behind the
kite as it moves.

## Putting it on a kite

Stepping back from the rope, each kite in the header is the sum of a few of these
pieces:

- A **rigid sail** — four triangular panels meeting at a center point — whose
  position and orientation are driven by low-pass-filtered Gaussian noise (the slow
  drift of the wind) plus a high-pass response to the mouse (the quick tugs when
  you grab it).
- Three **short ropes** anchored to the sail's corners and one long **control
  line**, every one of them a `PBDRope` re-pinned to its anchor each frame and
  evolved with gravity and wind as the constant force.
- A hand-drawn rendering pass that projects the 3D nodes to the screen and strokes
  them with a sketchy line, so the whole thing reads as a doodle rather than a
  physics demo.

None of it needs a solver library, implicit integration, or carefully tuned spring
constants. Position Based Dynamics gets the ropes looking right with a few dozen
lines: move the nodes, satisfy the constraints, read the velocity back off the
motion. That simplicity — and the unconditional stability that comes with it — is
why PBD has become the workhorse behind cloth, rope, and soft-body effects in games,
and why it was the obvious tool for making a few kites feel like they are really
flying.
