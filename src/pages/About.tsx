import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Award, Clock, Users, Heart } from "lucide-react";

const About = () => {
  const stats = [
    { icon: Clock, value: "10+", label: "Years of Excellence" },
    { icon: Users, value: "50K+", label: "Happy Customers" },
    { icon: Award, value: "100%", label: "Authentic Products" },
    { icon: Heart, value: "24/7", label: "Customer Support" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4 text-center">
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Our Story
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-secondary-foreground mt-4 mb-6">
              About MUGHAL BRAND'S
            </h1>
            <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto">
              A legacy of craftsmanship, precision, and timeless elegance since 2014.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Crafting Timeless Pieces
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  MUGHAL BRAND'S was founded with a singular vision: to bring world-class timepieces to discerning customers who appreciate the finer things in life. Our journey began in Lahore, Pakistan, where we set out to curate the most exquisite collection of watches.
                </p>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Every watch in our collection tells a story of precision engineering, meticulous craftsmanship, and timeless design. We partner with renowned manufacturers to ensure that each timepiece meets our exacting standards of quality and authenticity.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today, we are proud to serve thousands of customers across Pakistan, helping them find the perfect watch that reflects their style and personality.
                </p>
              </div>
              <div className="bg-muted rounded-lg aspect-square flex items-center justify-center">
                <span className="font-serif text-6xl text-primary">MB</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                  <p className="font-serif text-4xl font-bold text-foreground mb-2">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Our Values
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-card rounded-lg border border-border text-center">
                <h3 className="font-serif text-xl font-bold text-card-foreground mb-4">Quality</h3>
                <p className="text-muted-foreground">
                  We never compromise on quality. Every watch is carefully inspected and verified for authenticity before reaching you.
                </p>
              </div>
              <div className="p-8 bg-card rounded-lg border border-border text-center">
                <h3 className="font-serif text-xl font-bold text-card-foreground mb-4">Trust</h3>
                <p className="text-muted-foreground">
                  Building lasting relationships with our customers through transparency, honesty, and exceptional service.
                </p>
              </div>
              <div className="p-8 bg-card rounded-lg border border-border text-center">
                <h3 className="font-serif text-xl font-bold text-card-foreground mb-4">Excellence</h3>
                <p className="text-muted-foreground">
                  Striving for excellence in everything we do, from product selection to customer experience.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
