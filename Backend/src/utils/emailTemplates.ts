

export const getPasswordResetTemplate = (url: string) => ({
  subject: "Password Reset Request",
  text: `You requested a password reset. Click on the link to reset your password: ${url}`,
  html: `<!doctype html><html lang="en-US"><head><meta content="text/html; charset=utf-8" http-equiv="Content-Type"/><title>Reset Password Email Template</title><meta name="description" content="Reset Password Email Template."><style type="text/css">a:hover{text-decoration:underline!important}</style></head><body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0"><!--100%body table--><table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;"><tr><td><table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0"><tr><td style="height:80px;">&nbsp;</td></tr><tr><td style="text-align:center;"></a></td></tr><tr><td style="height:20px;">&nbsp;</td></tr><tr><td><table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);"><tr><td style="height:40px;">&nbsp;</td></tr><tr><td style="padding:0 35px;"><h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have requested to reset your password</h1><span style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span><p style="color:#455056; font-size:15px;line-height:24px; margin:0;">A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions.</p><a target="_blank" href="${url}" style="background:#2f89ff;text-decoration:none !important; font-weight:500; margin-top:24px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset Password</a></td></tr><tr><td style="height:40px;">&nbsp;</td></tr></table></td><tr><td style="height:20px;">&nbsp;</td></tr><tr><td style="text-align:center;"><p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy;</p></td></tr><tr><td style="height:80px;">&nbsp;</td></tr></table></td></tr></table><!--/100%body table--></body></html>`,
});

export const getVerifyEmailTemplate = (url: string) => ({
  subject: "Verify Email Address",
  text: `Click on the link to verify your email address: ${url}`,
  html: `<!doctype html><html lang="en-US"><head><meta content="text/html; charset=utf-8" http-equiv="Content-Type"/><title>Verify Email Address Email Template</title><meta name="description" content="Verify Email Address Email Template."><style type="text/css">a:hover{text-decoration:underline!important}</style></head><body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0"><!--100%body table--><table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;"><tr><td><table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0"><tr><td style="height:80px;">&nbsp;</td></tr><tr><td style="text-align:center;"></a></td></tr><tr><td style="height:20px;">&nbsp;</td></tr><tr><td><table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);"><tr><td style="height:40px;">&nbsp;</td></tr><tr><td style="padding:0 35px;"><h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Please verify your email address</h1><span style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span><p style="color:#455056; font-size:15px;line-height:24px; margin:0;">Click on the following link to verify your email address.</p><a target="_blank" href="${url}" style="background:#2f89ff;text-decoration:none !important; font-weight:500; margin-top:24px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Verify Email Address</a></td></tr><tr><td style="height:40px;">&nbsp;</td></tr></table></td><tr><td style="height:20px;">&nbsp;</td></tr><tr><td style="text-align:center;"><p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy;</p></td></tr><tr><td style="height:80px;">&nbsp;</td></tr></table></td></tr></table><!--/100%body table--></body></html>`,
});

export const getNewOptionsAddedTemplate = (eventName: string, eventUrl: string, newOptions: Record<string, string[]>) => {
  // Create a formatted list of categories and their new options
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr; // Return original string if parsing fails
    }
  };

  // Create a formatted list of categories and their new options
  const categoryList = Object.entries(newOptions)
    .map(([category, options]) => {
      // Format dates if the category is "date"
      const formattedOptions = category.toLowerCase() === 'date' 
        ? options.map(option => formatDate(option))
        : options;
      
      return `<li style="margin-bottom: 12px;"><strong>${category}:</strong> ${formattedOptions.join(', ')}</li>`;
    })
    .join('');

  return {
    subject: `New options added to "${eventName}"`,
    text: `Someone has added new options to the event "${eventName}" you previously responded to. Visit ${eventUrl} to update your response.`,
    html: `<!doctype html>
    <html lang="en-US">
    <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
      <title>New Options Added</title>
      <meta name="description" content="New Options Added Email">
      <style type="text/css">a:hover{text-decoration:underline!important}</style>
    </head>
    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
      <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr><td style="height:80px;">&nbsp;</td></tr>
        <tr><td style="text-align:center;"></td></tr>
        <tr><td style="height:20px;">&nbsp;</td></tr>
        <tr>
          <td>
            <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
              <tr><td style="height:40px;">&nbsp;</td></tr>
              <tr>
                <td style="padding:0 35px;">
                  <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">New Options Added</h1>
                  <span style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                  <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                    Someone has added new options to the event "${eventName}" you previously responded to.
                  </p>
                  <p style="color:#455056; font-size:15px;line-height:24px; margin:16px 0;">
                    The following new options are now available:
                  </p>
                  <ul style="text-align:left; color:#455056; font-size:15px;line-height:24px; margin:0; padding: 0 40px;">
                    ${categoryList}
                  </ul>
                  <a target="_blank" href="${eventUrl}" style="background:#2f89ff;text-decoration:none !important; font-weight:500; margin-top:24px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Update Your Response</a>
                </td>
              </tr>
              <tr><td style="height:40px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:20px;">&nbsp;</td></tr>
        <tr><td style="text-align:center;"><p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy;</p></td></tr>
        <tr><td style="height:80px;">&nbsp;</td></tr>
      </table>
    </body>
    </html>`,
  };
};

// NEW: Email template for finalized events
export const getEventFinalizedTemplate = (
  eventName: string, 
  finalizedDate: string | null, 
  finalizedPlace: string | null,
  customFieldSelections: Record<string, any>,
  finalizedEventUrl: string
) => {
  // Format the finalized date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Create a formatted list of custom field selections
  const customFieldsList = Object.entries(customFieldSelections)
    .map(([fieldId, selection]) => {
      const fieldTitle = selection.fieldTitle || fieldId;
      let displayValue = '';
      
      if (Array.isArray(selection.selection)) {
        displayValue = selection.selection.join(', ');
      } else {
        displayValue = selection.selection?.toString() || '';
      }
      
      return `<li style="margin-bottom: 12px;"><strong>${fieldTitle}:</strong> ${displayValue}</li>`;
    })
    .join('');

  const hasCustomFields = Object.keys(customFieldSelections).length > 0;

  return {
    subject: `"${eventName}" has been finalized!`,
    text: `The event "${eventName}" has been finalized! Date: ${formatDate(finalizedDate)}, Location: ${finalizedPlace || 'Not specified'}. Visit ${finalizedEventUrl} to view all details.`,
    html: `<!doctype html>
    <html lang="en-US">
    <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
      <title>Event Finalized</title>
      <meta name="description" content="Event Finalized Email">
      <style type="text/css">a:hover{text-decoration:underline!important}</style>
    </head>
    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
      <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr><td style="height:80px;">&nbsp;</td></tr>
        <tr><td style="text-align:center;"></td></tr>
        <tr><td style="height:20px;">&nbsp;</td></tr>
        <tr>
          <td>
            <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
              <tr><td style="height:40px;">&nbsp;</td></tr>
              <tr>
                <td style="padding:0 35px;">
                  <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">🎉 Event Finalized!</h1>
                  <span style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                  <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                    Great news! The event "<strong>${eventName}</strong>" has been finalized with all the details confirmed.
                  </p>
                  
                  <!-- Event Details Section -->
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: left;">
                    <h2 style="color:#1e1e2d; font-size:20px; margin:0 0 16px 0; font-family:'Rubik',sans-serif;">📅 Final Event Details</h2>
                    
                    <div style="margin-bottom: 16px;">
                      <strong style="color:#1e1e2d;">Date & Time:</strong><br>
                      <span style="color:#455056;">${formatDate(finalizedDate)}</span>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                      <strong style="color:#1e1e2d;">Location:</strong><br>
                      <span style="color:#455056;">${finalizedPlace || 'No location specified'}</span>
                    </div>
                    
                    ${hasCustomFields ? `
                    <div style="margin-bottom: 16px;">
                      <strong style="color:#1e1e2d;">Additional Details:</strong><br>
                      <ul style="color:#455056; font-size:15px; margin:8px 0; padding-left: 20px;">
                        ${customFieldsList}
                      </ul>
                    </div>
                    ` : ''}
                  </div>
                  
                  <p style="color:#455056; font-size:15px;line-height:24px; margin:16px 0;">
                    Click the button below to view the complete event details and add it to your calendar.
                  </p>
                  
                  <a target="_blank" href="${finalizedEventUrl}" style="background:#28a745;text-decoration:none !important; font-weight:500; margin-top:24px; color:#fff;text-transform:uppercase; font-size:14px;padding:12px 32px;display:inline-block;border-radius:50px;">View Event Details</a>
                </td>
              </tr>
              <tr><td style="height:40px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:20px;">&nbsp;</td></tr>
        <tr><td style="text-align:center;"><p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy;</p></td></tr>
        <tr><td style="height:80px;">&nbsp;</td></tr>
      </table>
    </body>
    </html>`,
  };
};