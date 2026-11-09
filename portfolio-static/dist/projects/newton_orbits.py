import tkinter as tk
import math
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

G = 6.674e-11  # gravitational constant


def calculate():
    try:
        m1 = float(entry_m1.get())
        m2 = float(entry_m2.get())
        r = float(entry_r.get())

        # keep the numbers in range the computer doesn't blow up
        if not (m1 >= 1e-6 and m1 <= 1e45 and m2 >= 1e-6 and m2 <= 1e45 and r >= 1e-3 and r <= 1e20):
            raise ValueError

        force = G * m1 * m2 / r**2
        label_out.config(text=f"F = {force:.3e} N", fg="green")

        btn.config(state="disabled")  # stop the button being pressed mid animation
        animate(m1, m2, r)
        btn.config(state="normal")
    except ValueError:
        label_out.config(text="Enter numbers: masses 1e-6 to 1e45,\ndistance 1e-3 to 1e20",font=("Papyrus"), fg="red")
    except tk.TclError:
        pass


def animate(m1, m2, r):
    total = m1 + m2

    # start r apart, centered around (0, 0, 0)
    pos1 = [0, 0, 0]
    pos2 = [r, 0, 0]

    # move sideways (in y and z, so the orbit is tilted in 3D)
   # speed = 0.7 * math.sqrt(G * total / r)#makes an ellipese
    speed = 0.894 * math.sqrt(G * total / r)  #makes it centered

    vel1 = [0, -speed * m2 / total, 0]
    vel2 = [0, speed * m1 / total, 0]

    # time step: one orbit takes about 1000 steps
    dt = 2 * math.pi * math.sqrt(r**3 / (G * total)) / 1000

    trail1 = [[], [], []]  # x, y,z  object 1
    trail2 = [[], [], []]

    for frame in range(300):
        for step in range(5):
            # distance between objects
            d = [pos2[0] - pos1[0], pos2[1] - pos1[1], pos2[2] - pos1[2]]
            distance = math.sqrt(d[0]**2 + d[1]**2 + d[2]**2)

            # Newton's law, then a = f/m
            force = G * m1 * m2 / distance**2
            for i in range(3):
                vel1[i] = vel1[i] + force / m1 * d[i] / distance * dt
                vel2[i] = vel2[i] - force / m2 * d[i] / distance * dt
                pos1[i] = pos1[i] + vel1[i] * dt
                pos2[i] = pos2[i] + vel2[i] * dt

        for i in range(3):
            trail1[i].append(pos1[i])
            trail2[i].append(pos2[i])

        ax.cla()
        ax.plot(trail1[0], trail1[1], trail1[2], color="blue")
        ax.plot(trail2[0], trail2[1], trail2[2], color="orange")
        ax.scatter([pos1[0]], [pos1[1]], [pos1[2]], s=150, color="blue", label="Object 1")
        ax.scatter([pos2[0]], [pos2[1]], [pos2[2]], s=150, color="orange", label="Object 2")
        ax.set_xlim(-r, r)
        ax.set_ylim(-r, r)
        ax.set_zlim(-r, r)
        ax.set_title(f"distance = {distance:.3e} m\nforce = {force:.3e} N")
        ax.legend(loc="upper left")
        canvas.draw()
        root.update()  # let the window respond


root = tk.Tk()
root.title("Newton's Law of Universal Gravitation")
root.configure(padx=16, pady=16)

tk.Label(root, text="F = G · m1 · m2 / r²", font=("Papyrus", 20, "bold")).grid(row=0, column=0, columnspan=2)
tk.Label(root, text="G = 6.674e-11",font=("Papyrus")).grid(row=1, column=0, columnspan=2)

tk.Label(root, text="Mass 1 (kg)", font=("Papyrus")).grid(row=2, column=0, sticky="e", padx=6, pady=6)
entry_m1 = tk.Entry(root, width=12)
entry_m1.grid(row=2, column=1, padx=6, pady=6)

tk.Label(root, text="Mass 2 (kg)", font=("Papyrus")).grid(row=3, column=0, sticky="e", padx=6, pady=6)
entry_m2 = tk.Entry(root, width=12)
entry_m2.grid(row=3, column=1, padx=6, pady=6)

tk.Label(root, text="Distance (m)", font=("Papyrus")).grid(row=4, column=0, sticky="e", padx=6, pady=6)
entry_r = tk.Entry(root, width=12)
entry_r.grid(row=4, column=1, padx=6, pady=6)

tk.Label(root, text="Example: 5.97e24 (Earth), 7.35e22(Moon), 3.84e8(Meters between center of earth and moon)", font="Papyrus", fg="gray").grid(row=5, column=0, columnspan=2)

btn = tk.Button(root, text="Calculate and Animate", command=calculate)
btn.grid(row=6, column=0, columnspan=2, pady=10)

label_out = tk.Label(root, text="", font=("Arial", 12, "bold"))
label_out.grid(row=7, column=0, columnspan=2)

fig = Figure(figsize=(6, 6))
ax = fig.add_subplot(111, projection="3d")
canvas = FigureCanvasTkAgg(fig, master=root)
canvas.get_tk_widget().grid(row=0, column=2, rowspan=9, padx=10)
root.grid_rowconfigure(8, weight=1)  # empty row takes the spare height

entry_m1.focus_set()
root.mainloop()