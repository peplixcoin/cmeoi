import React from "react";

export default function LoungeInstructionsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Instructions & Terms for Booking Lounges</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Booking Charges and Conditions</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Booking charges to be paid in advance at the time of booking.</li>
          <li>No change in charges after the estimate is made.</li>
          <li>No Barat, Religious Rituals or bursting of crackers permitted.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Services Provided</h2>
        <p>The following services are provided by the Officers Institute (OI):</p>
        <ul className="list-disc text-sm list-inside mt-2">
          <li><strong>Waiters:</strong> 1/15 guests for Aqua Lounge/Molotov Corner/Mini Lounge, 1/20 for Main Lounge and Rear Lawn.</li>
          <li><strong>Bar Counters:</strong> One bar counter provided; two for 50–100 guests.</li>
          <li><strong>Layout:</strong> Seating, buffet table, and lighting arranged as per norms.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Additional Services</h2>
        <ul className="list-disc text-sm list-inside">
          <li>Additional waiters: ₹1000 each</li>
          <li>Additional bar counters: ₹1500 each</li>
          <li>Breakages: Charged as per actuals</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Catering</h2>
        <ul className="list-disc text-sm list-inside">
          <li>Catering includes crockery, cutlery for up to 100 guests by OI-approved menu only.</li>
          <li>Above 100 guests: members must hire private caterers, pay charges for using kitchen.</li>
          <li>Catering by OI or self—approval needed 10 days prior for outsourced services.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Decoration & Lighting</h2>
        <ul className="list-disc text-sm list-inside">
          <li>Restricted to specific areas like entrance, dance floor, bar, food counters.</li>
          <li>Use of external lights limited to permitted zones.</li>
          <li>No walls, Chijjal or ceiling allowed to be used for decorations.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Music & DJ</h2>
        <ul className="list-disc text-sm list-inside">
          <li>Music and DJ only allowed in Rear Lawn, not in Main Lounge.</li>
          <li>Volume must not exceed 45 dB, music off by 2230 hrs.</li>
          <li>Mobile speakers allowed with charges: ₹500 (party) and ₹1000 (marriage)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Cancellation & Security</h2>
        <ul className="list-disc text-sm list-inside">
          <li>Cancellation charges: 25% of booking amt if canceled 72+ hrs prior, 50% if 24-72 hrs, 75% within 24 hrs.</li>
          <li>Refundable security deposit: ₹1000 (party) and ₹10000 (marriage). Deductions for damage, cleaning, breakages.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Other Guidelines</h2>
        <ul className="list-disc text-sm list-inside">
          <li>Private functions/parties end by 2300 hrs.</li>
          <li>Marriage functions end by 2330 hrs.</li>
          <li>Parking only in designated slots (in front of main and rear entrances of OI only)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Extra Charges (if premises not vacated on time)</h2>
        <ul className="list-disc text-sm list-inside">
          <li>Main Lounge (Marriage): ₹2000/hr (Member), ₹2500/hr (Temp)</li>
          <li>Rear Lawn (Marriage): ₹2500/hr (Member), ₹3000/hr (Temp)</li>
          <li>Main Lounge (Party): ₹500/hr (Member), ₹600/hr (Temp)</li>
          <li>Rear Lawn (Party): ₹750/hr (Member), ₹1000/hr (Temp)</li>
          <li>Mini Lounge/Aqua/Molotov: ₹150/hr (Member), ₹200/hr (Temp)</li>
        </ul>
      </section>

      <p className="text-sm text-gray-600 mt-6">Please ensure you have read the complete SOP and instructions before booking. Misuse or violation of rules may result in penalties or forfeiture of the security deposit.</p>
    </div>
  );
}
