import Button from '../common/Button'

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Contact Us</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-2">Name</label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 border rounded-md"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block mb-2">Email</label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 border rounded-md"
                placeholder="Your email"
              />
            </div>
            <div>
              <label htmlFor="message" className="block mb-2">Message</label>
              <textarea
                id="message"
                rows="4"
                className="w-full px-4 py-2 border rounded-md"
                placeholder="Your message"
              ></textarea>
            </div>
            <Button className="w-full">Send Message</Button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Contact
