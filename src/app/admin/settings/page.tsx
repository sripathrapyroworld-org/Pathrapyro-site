import { saveBusinessSettings } from "@/app/admin/actions";
import { getSettings, toIstDatetimeLocal } from "@/lib/settings";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <form
      className="card panel static"
      style={{ maxWidth: 720 }}
      action={async (fd) => {
        "use server";
        await saveBusinessSettings(fd);
      }}
    >
      <h3 style={{ marginBottom: 18 }}>Business Details</h3>
      <div className="form-row">
        <div className="field"><label>Business Name</label><input name="businessName" defaultValue={s.businessName} /></div>
        <div className="field"><label>Tagline</label><input name="tagline" defaultValue={s.tagline} /></div>
        <div className="form-row two">
          <div className="field"><label>GSTIN</label><input name="gstin" defaultValue={s.gstin} /></div>
          <div className="field"><label>Explosives License No.</label><input name="license" defaultValue={s.license} /></div>
        </div>
        <div className="form-row two">
          <div className="field">
            <label>GST % (on product subtotal)</label>
            <input name="gstPercent" type="number" min={0} step={0.01} defaultValue={s.gstPercent} />
          </div>
          <div className="field">
            <label>Default packing charge (₹, admin reference)</label>
            <input name="packingCharge" type="number" min={0} step={1} defaultValue={s.packingCharge} />
            <small style={{ color: "var(--cream-dim)", fontSize: "0.78rem" }}>
              Per-customer packing &amp; shipping are set on the customer profile after enquiry.
            </small>
          </div>
        </div>
        <div className="field"><label>Address</label><textarea name="address" rows={2} defaultValue={s.address} /></div>
        <div className="field"><label>City line (footer)</label><input name="cityLine" defaultValue={s.cityLine} /></div>
        <div className="form-row two">
          <div className="field">
            <label>Customer care</label>
            <input name="phone" defaultValue={s.phone} />
          </div>
          <div className="field">
            <label>Ganesh Kumar — phone 1</label>
            <input name="phone2" defaultValue={s.phone2} />
          </div>
        </div>
        <div className="form-row two">
          <div className="field">
            <label>Ganesh Kumar — phone 2</label>
            <input name="phone3" defaultValue={s.phone3} />
          </div>
          <div className="field">
            <label>Muthuram P</label>
            <input name="phone4" defaultValue={s.phone4} />
          </div>
        </div>
        <div className="form-row two">
          <div className="field"><label>WhatsApp Number</label><input name="whatsapp" defaultValue={s.whatsapp} /></div>
          <div className="field"><label>Email</label><input name="email" defaultValue={s.email} /></div>
        </div>
        <div className="field"><label>Working hours</label><input name="hours" defaultValue={s.hours} /></div>
        <div className="field"><label>Map embed URL</label><input name="mapEmbed" defaultValue={s.mapEmbed} /></div>
        <div className="field"><label>Top bar marquee</label><textarea name="marquee" rows={2} defaultValue={s.marquee} /></div>
      </div>

      <h3 style={{ margin: "28px 0 8px" }}>Homepage offer banner</h3>
      <p className="cell-sub" style={{ marginBottom: 16 }}>
        Controls the countdown card on the home page hero. Date and time are in Indian Standard Time.
      </p>
      <label className="customer-quote-check" style={{ marginBottom: 14 }}>
        <input type="checkbox" name="countdownEnabled" defaultChecked={s.countdownEnabled} />
        <span>Show offer countdown on homepage</span>
      </label>
      <div className="form-row">
        <div className="field">
          <label>Small label</label>
          <input name="countdownEyebrow" defaultValue={s.countdownEyebrow} placeholder="Offer ends in" />
        </div>
        <div className="field">
          <label>Heading</label>
          <input name="countdownHeading" defaultValue={s.countdownHeading} placeholder="Diwali Sale Countdown" />
        </div>
        <div className="field">
          <label>Offer ends at</label>
          <input
            name="countdownEndsAt"
            type="datetime-local"
            defaultValue={toIstDatetimeLocal(s.countdownEndsAt)}
            required
          />
        </div>
        <div className="field">
          <label>Note (optional)</label>
          <textarea
            name="countdownNote"
            rows={3}
            defaultValue={s.countdownNote}
            placeholder="e.g. Extra 10% off combo packs until the sale ends. Limited stock."
          />
        </div>
        <div className="field">
          <label>Button text</label>
          <input name="countdownButtonLabel" defaultValue={s.countdownButtonLabel} placeholder="Place Quick Order →" />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary">Save Changes</button>
      </div>
    </form>
  );
}
