from manim import *
import traceback

class WhatIsPythogrensTheoremDeepExplainVisualRepresentationScene(Scene):
    def construct(self):
        try:
            # Title
            title = Text("what is pythogrens theorem deep explain visual representation", font_size=48)
            self.play(Write(title))
            self.wait(1)  # Wait for 1 second
            self.play(FadeOut(title))

            # Main content with error handling
                        # Title Screen
            title = Tex("Pythagorean Theorem")
            title.scale(1.5)
            self.play(Write(title))
            self.wait(1)
            # Initial Statement of the Theorem
            statement = MathTex("a^2 + b^2 = c^2")
            statement.scale(1.5)
            self.play(Transform(title, statement))
            self.wait(1)
            # Visual Proof or Demonstration
            demonstration = Text("Visual Proof")
            demonstration.scale(1.2)
            self.play(Transform(statement, demonstration))
            self.wait(1)
            # Step-by-Step Construction
            construction = Text("Step-by-Step Construction")
            construction.scale(1.2)
            self.play(Transform(demonstration, construction))
            self.wait(1)
            # Practical Applications
            applications = Text("Practical Applications")
            applications.scale(1.2)
            self.play(Transform(construction, applications))
            self.wait(1)
            # Interactive Elements
            interactive = Text("Interactive Elements")
            interactive.scale(1.2)
            self.play(Transform(applications, interactive))
            self.wait(1)
            # Summary or Key Points
            summary = Text("Summary")
            summary.scale(1.2)
            self.play(Transform(interactive, summary))
            self.wait(1)
            # End Screen
            end = Text("Thank you!")
            end.scale(1.5)
            self.play(Transform(summary, end))
            self.wait(1)

            self.wait(1)  # Final wait before ending the scene

        except Exception as e:
            # Handle any runtime errors
            error_text = Text(f"Error: {str(e)}", color=RED)
            self.play(Write(error_text))
            self.wait(2)
            logger.error(f"Animation error: {str(e)}")
            logger.error(traceback.format_exc())