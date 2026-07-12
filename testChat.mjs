const testQueries = [
  "What is the address?",
  "Who is the founder of Aakar's?",
  "What are the fees for JEE?",
  "Tell me about the physics faculty",
  "Who is Kajal Yadav?",
  "How can I download past papers?",
  "What were the NEET results?",
  "Who got Rank 1 in MHT-CET PCB?",
  "Do you have a NEET foundation course?",
  "What is the focus JEE 2028 program?"
];

async function runTests() {
  console.log("=== Running Chat Tests ===\\n");
  for (const q of testQueries) {
    console.log(`Q: ${q}`);
    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q })
      });
      const data = await res.json();
      console.log(`A: \\n${data.response}\\n`);
      console.log("-".repeat(50));
    } catch (e) {
      console.error(`Failed: ${e.message}`);
    }
  }
}

runTests();
