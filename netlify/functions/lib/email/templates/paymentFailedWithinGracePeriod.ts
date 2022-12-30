export const paymentFailedWithinGracePeriodBody = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:750px;overflow:auto;line-height:2">
		<div style="margin:50px auto;width:70%;padding:20px 0">
		  <div style="border-bottom:1px solid #eee">
			<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Oh no! Your payment failed for Reminder App Subscription</a>
		  </div>
		  <p style="font-size:1.1em">Hi,</p>
      <p>Unfortunately we were unable to charge you for your <b>Reminder App</b> Premium License subscription.<p/>
      <p> We don't want your service to get interrupted, so we've extended your subscription until <u><b>{{nextBillDate}}</b></u> while you can fix this by updating your billing information. You can find the license key for this attached to this email.</p>
      <p>Note: As per our policy, we automatically try to retry payment for maximum 3 times past due date (on 3rd, 5th and 7th day post due date). During this period, your subscription will still be active. However, after the 3rd retry, if the payment is still failing, then your subscription will be paused and you've be migrated to free plan where you won't have access to our <a href="https://docs.appsforchat.com/reminder-bot/guides/premium-license/benefits-of-getting-license"> premium features</a>. </p>
      <table width="100%" cellspacing="0" cellpadding="0">
  <tr>
      <td>
          <table cellspacing="0" cellpadding="0">
              <tr>
                  <td style="border-radius: 2px;" bgcolor="#4073f5">
                      <a href="https://www.copernica.com" target="_blank" style="padding: 8px 12px; border: 1px solid #4073f5;border-radius: 2px;font-family: Helvetica, Arial, sans-serif;font-size: 14px; color: #ffffff;text-decoration: none;font-weight:bold;display: inline-block;">
                          Update Billing            
                      </a>
                  </td>
              </tr>
          </table>
      </td>
  </tr>
</table>
      <h3>Premium License key</h3>
<table cellpadding="0" cellspacing="0" style="background: pink;">
	  <tr>
		<td style="background: pink; color: #000; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 13px; padding: 10px 15px;">
			<pre style="-moz-tab-size: 2; -ms-hyphens: none; -o-tab-size: 2; -webkit-hyphens: none; color: #000; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 13px; hyphens: none; line-height: 1.5; overflow: auto; tab-size: 2; text-align: left; white-space: pre; word-break: break-all; word-spacing: normal; word-wrap: normal;">{{license}}</pre>
		</td>
	</tr>
</table>
<h3>License Setup Guide:</h3> <a href="https://docs.appsforchat.com/reminder-bot/guides/premium-license/how-to-set-up-your-license-on-rocket.chat-server">Click here for instructions on how to setup your license key</a>
<h3>A couple of important notes about your license key:</h3>
<ul>
<li>It's for workspace with URL: {{workspaceAddress}}</li>
<li>Its valid until: {{licenseExpiration}}</li>
      </ul>
      
      <h3> Need help? </h3>
      <p> If you need any assistance or, if you have any queries, please <a href="https://appsforchat.com/contact">contact us here</a>.<p> 
		<p style="font-size:0.9em;">Regards,<br />Reminder App Team</p>
      Contact us: <a href="mailto:contact@appsforchat.com">contact@appsforchat.com</a>
		  <hr style="border:none;border-top:1px solid #eee" />
		</div>
	  </div>`;

export const paymentFailedWithinGracePeriodSubject = `[Action Required] Your payment failed for Reminder App Subscription`;
