import React from "react";

const ContactForm = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <iframe
        src="https://form.maarifasasa.com/contact?alignLeft=1&transparentBackground=1&dynamicHeight=1&formEventsForwarding=1&embed=1"
        className="w-full border-0"
        style={{ minHeight: '600px' }}
        title="Contact Form"
      />
    </div>
  );
};

export default ContactForm;
