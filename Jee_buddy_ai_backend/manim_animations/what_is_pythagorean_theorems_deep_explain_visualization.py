from manim import *
import traceback

class WhatIsPythagoreanTheoremsDeepExplainScene(Scene):
    def construct(self):
        try:
            # Title
            title = Text("what is pythagorean theorems deep explain", font_size=48)
            self.play(Write(title))
            self.wait(1)  # Wait for 1 second
            self.play(FadeOut(title))

            # Main content with error handling
                        # Title screen
            title = Tex("What is the Pythagorean Theorem?").scale(1.5)
            self.play(Write(title))
            self.wait(2)
            self.play(FadeOut(title))
            # Initial statement
            statement = MathTex("a^2 + b^2 = c^2").scale(2)
            self.play(Write(statement))
            self.wait(2)
            # Visual proof
            self.play(Transform(statement, MathTex("a^2", "+", "b^2", "=", "c^2")))
            self.wait()
            self.play(ReplacementTransform(statement[0].copy(), statement[2]))
            self.play(ReplacementTransform(statement[4].copy(), statement[0]))
            self.play(ReplacementTransform(statement[2].copy(), statement[4]))
            self.wait()
            # Step-by-step construction
            triangle = Polygon(
            np.array([-2, -2, 0]),
            np.array([4, -2, 0]),
            np.array([-2, 3, 0]),
            fill_color=BLUE,
            fill_opacity=0.5
            )
            self.play(Create(triangle))
            self.wait()
            side_a = Line(triangle.get_vertices()[0], triangle.get_vertices()[2], color=YELLOW)
            side_b = Line(triangle.get_vertices()[1], triangle.get_vertices()[2], color=YELLOW)
            side_c = Line(triangle.get_vertices()[0], triangle.get_vertices()[1], color=YELLOW)
            self.play(Create(side_a), Create(side_b), Create(side_c))
            self.wait()
            self.play(Write(statement))
            self.wait()
            # Practical applications
            applications = Text("Practical Applications", font_size=48).to_edge(UP)
            self.play(Write(applications))
            self.wait(2)
            self.play(FadeOut(applications))
            # Interactive elements
            interactive = Text("Interactive Elements", font_size=48).to_edge(UP)
            self.play(Write(interactive))
            self.wait(2)
            # Summary screen
            summary = Tex("Key Points:", font_size=48).scale(1.2)
            self.play(Write(summary))
            self.wait(2)
            self.play(FadeOut(summary))
            self.wait(2)

            self.wait(1)  # Final wait before ending the scene

        except Exception as e:
            # Handle any runtime errors
            error_text = Text(f"Error: {str(e)}", color=RED)
            self.play(Write(error_text))
            self.wait(2)
            logger.error(f"Animation error: {str(e)}")
            logger.error(traceback.format_exc())