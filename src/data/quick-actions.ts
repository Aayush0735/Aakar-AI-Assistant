/**
 * Quick Action Chips — Hardcoded responses that cost $0 in API calls.
 * These are displayed immediately when the user opens the chat widget.
 *
 * To customize: replace the placeholder values below with your actual
 * coaching center's information.
 */

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  response: string;
}

export const quickActions: QuickAction[] = [
  {
    id: "past-papers",
    label: "Download Past Papers",
    icon: "📄",
    response: `Here are the past papers available for download:\n\n📝 **JEE Mains**\n• [2024 Physics](https://storage.example.com/papers/jee-mains-physics-2024.pdf)\n• [2024 Chemistry](https://storage.example.com/papers/jee-mains-chemistry-2024.pdf)\n• [2024 Mathematics](https://storage.example.com/papers/jee-mains-maths-2024.pdf)\n• [2023 Physics](https://storage.example.com/papers/jee-mains-physics-2023.pdf)\n\n📝 **NEET**\n• [2024 Biology](https://storage.example.com/papers/neet-biology-2024.pdf)\n• [2024 Physics](https://storage.example.com/papers/neet-physics-2024.pdf)\n• [2023 Biology](https://storage.example.com/papers/neet-biology-2023.pdf)\n\n📝 **MHT-CET**\n• [2024 PCM](https://storage.example.com/papers/cet-pcm-2024.pdf)\n• [2024 PCB](https://storage.example.com/papers/cet-pcb-2024.pdf)\n\nNeed a specific paper? Just type the exam name and year!`,
  },
  {
    id: "batch-timings",
    label: "New Batch Timings",
    icon: "🕐",
    response: `Here are our upcoming batch timings:\n\n🎯 **JEE 2026 Batches**\n• Morning Batch: 7:00 AM – 10:00 AM (Mon–Sat)\n• Evening Batch: 5:00 PM – 8:00 PM (Mon–Sat)\n• Weekend Batch: 9:00 AM – 1:00 PM (Sat & Sun)\n\n🎯 **NEET 2026 Batches**\n• Morning Batch: 7:30 AM – 10:30 AM (Mon–Sat)\n• Afternoon Batch: 1:00 PM – 4:00 PM (Mon–Sat)\n• Weekend Batch: 2:00 PM – 6:00 PM (Sat & Sun)\n\n🎯 **Foundation Batches (Class 8–10)**\n• After-School Batch: 4:00 PM – 6:00 PM (Mon–Fri)\n• Weekend Batch: 10:00 AM – 1:00 PM (Sat & Sun)\n\n📞 Call us at **+91 98765 43210** for more details or to reserve your seat!`,
  },
  {
    id: "fee-structure",
    label: "Fee Structure",
    icon: "💰",
    response: `Here's our fee structure for the academic year 2025–2026:\n\n💎 **JEE Comprehensive (2-Year Program)**\n• Total Fee: ₹1,50,000\n• EMI Available: ₹12,500/month × 12 months\n\n💎 **NEET Comprehensive (2-Year Program)**\n• Total Fee: ₹1,40,000\n• EMI Available: ₹11,667/month × 12 months\n\n💎 **Crash Course (3 Months)**\n• JEE: ₹45,000\n• NEET: ₹40,000\n\n💎 **Foundation Program (Class 8–10)**\n• Annual Fee: ₹60,000\n• EMI Available: ₹5,000/month × 12 months\n\n🏆 **Scholarships**: Up to 100% fee waiver based on entrance test performance!\n\n📞 Visit our center or call **+91 98765 43210** for detailed counseling.`,
  },
  {
    id: "contact",
    label: "Address & Contact",
    icon: "📍",
    response: `Here's how to reach us:\n\n📍 **Address**\n[Center Name] Academy\n2nd Floor, Knowledge Tower,\nStation Road, Near City Mall,\nMumbai – 400001, Maharashtra\n\n📞 **Phone**: +91 98765 43210\n📧 **Email**: info@centername.com\n🌐 **Website**: www.centername.com\n\n⏰ **Office Hours**\n• Monday – Saturday: 8:00 AM – 8:00 PM\n• Sunday: 9:00 AM – 2:00 PM\n\n🗺️ **Landmarks**: Opposite Central Railway Station, above State Bank of India\n\nWe'd love to see you! Walk-ins are welcome during office hours.`,
  },
];
