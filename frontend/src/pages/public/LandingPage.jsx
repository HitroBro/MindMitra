import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, ShieldCheck, Users, CalendarHeart, Smile, BookHeart, Library, ArrowRight,
  Sparkles, ChevronDown, Mail, Phone,
} from 'lucide-react';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const features = [
  { icon: Brain, title: 'AI Mental Health First-Aid', desc: 'A calm, always-available assistant that listens first and guides you toward the right next step — never a replacement for real care, always a bridge to it.' },
  { icon: CalendarHeart, title: 'Book a Counselor', desc: 'Request time with a campus counselor in a few taps. Track status from pending to confirmed without the back-and-forth.' },
  { icon: Users, title: 'Anonymous Peer Community', desc: 'Share what you\'re carrying without your name attached. Moderated by trained student volunteers around the clock.' },
  { icon: Smile, title: 'Mood & PHQ-9 / GAD-7', desc: 'Clinically-grounded self-assessments and daily mood check-ins that build a picture over time — for you and, if you choose, your counselor.' },
  { icon: BookHeart, title: 'Private Journal', desc: 'A space that\'s yours alone. Write freely, look back whenever you need to.' },
  { icon: Library, title: 'Resource Library', desc: 'Curated articles, audio sessions and videos on stress, sleep, focus and more — searchable, bookmarkable, always free.' },
];

const faqs = [
  { q: 'Is what I share actually private?', a: 'Anonymous posts never expose your identity to other students. Assessment and journal data is visible only to you unless you choose to share it with a counselor.' },
  { q: 'Who reads my chat with the AI assistant?', a: 'Conversations are stored securely and reviewed only if our emergency-detection system flags a message as high-risk, so a real person can follow up and help.' },
  { q: 'Is this a replacement for therapy?', a: 'No. MindMitra is first-aid and a bridge — for ongoing care, we connect you directly with your campus counselors.' },
  { q: 'What happens if I mention self-harm?', a: 'Our system detects it immediately and flags it for a counselor, and you\'ll be shown emergency helpline numbers right away.' },
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute top-40 -left-24 w-80 h-80 rounded-full bg-amber-400/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600/10 text-teal-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Built for Indian campuses
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-semibold text-teal-900 leading-[1.1] mb-6">
              Someone to talk to,
              <br />
              <span className="text-teal-600">whenever it's hard.</span>
            </h1>
            <p className="text-lg text-teal-800/80 max-w-md mb-8 leading-relaxed">
              MindMitra brings AI-guided first-aid, real counselors, and an anonymous peer
              community into one place — built quietly, for students who need it most.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn bg-teal-600 hover:bg-teal-700 text-white border-none rounded-full px-7 gap-2">
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#about" className="btn btn-outline border-teal-600/30 text-teal-700 hover:bg-teal-600/5 rounded-full px-7">
                Learn more
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-sand-50/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-soft p-6 max-w-sm mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-teal-800">MindMitra Assistant</p>
                  <p className="text-xs text-teal-600/70">Here for you, day or night</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-teal-600/10 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-teal-800 max-w-[85%]">
                  I've had trouble sleeping before exams. Is that normal?
                </div>
                <div className="bg-teal-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%] ml-auto">
                  Completely — exam stress often shows up as sleep trouble first. Want to try a quick wind-down routine together?
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-20 bg-sand-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-amber-600 mb-3 tracking-wide uppercase">About MindMitra</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-teal-900 mb-5">
            Digital mental health support, designed for the realities of student life
          </h2>
          <p className="text-teal-800/80 leading-relaxed max-w-2xl mx-auto">
            Built for the Smart India Hackathon, MindMitra connects students to AI-guided
            first-aid, licensed campus counselors, and a moderated peer community — all backed
            by real clinical tools like PHQ-9 and GAD-7, in one platform your institution can trust.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-amber-600 mb-3 tracking-wide uppercase">What's inside</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-teal-900">Everything a campus needs, in one place</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ delay: i * 0.05 }}
                className="bg-sand-50 rounded-2xl p-6 shadow-card hover:shadow-soft transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-600/10 flex items-center justify-center text-teal-600 mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-teal-900 mb-2">{f.title}</h3>
                <p className="text-sm text-teal-800/70 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 py-20 bg-teal-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ShieldCheck className="w-10 h-10 mx-auto mb-6 text-amber-400" />
          <p className="font-display text-2xl md:text-3xl leading-snug mb-6">
            "The anonymous forum meant I could finally say out loud what I'd been carrying alone
            for months — and someone actually responded."
          </p>
          <p className="text-white/70 text-sm">— A student pilot participant</p>
        </div>
      </section>

      {/* FAQS */}
      <section id="faqs" className="px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-600 mb-3 tracking-wide uppercase">FAQs</p>
            <h2 className="font-display text-3xl font-semibold text-teal-900">Questions, answered</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={f.q} className="bg-sand-50 rounded-2xl shadow-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-teal-900 text-sm">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-teal-600 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-5 pb-4 text-sm text-teal-800/70 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / CTA */}
      <section id="contact" className="px-6 py-20 bg-sand-50">
        <div className="max-w-4xl mx-auto bg-teal-600 rounded-3xl px-8 py-14 text-center text-white">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">Ready when you are</h2>
          <p className="text-white/80 max-w-md mx-auto mb-8">
            Sign up in under a minute. No judgment, no waiting rooms — just support that meets you where you are.
          </p>
          <Link to="/register" className="btn bg-amber-500 hover:bg-amber-600 text-teal-900 border-none rounded-full px-8 gap-2">
            Create your account <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex justify-center gap-8 mt-10 text-sm text-white/70">
            <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@mindmitra.app</span>
            <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> Campus helpdesk</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
