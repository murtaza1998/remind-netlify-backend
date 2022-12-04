export const newSubAddedEmailTemplateBody = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:750px;overflow:auto;line-height:2">
<div style="margin:50px auto;width:70%;padding:20px 0">
  <div style="border-bottom:1px solid #eee">
	<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">New Reminder App Subscription was Added </a>
  </div>
  <p style="font-size:1.1em">Hi,</p>
  <p>Thank you for choosing Reminder App! Your {{planDuration}} subscription has been successfully activated 🎉 You may find the license key within this email which you would need to activate your license within your Rocket.Chat workspace. Please follow the "License Setup Guide" to activate your license. </p>
  <h3>Premium License</h3>
<table cellpadding="0" cellspacing="0" style="background: pink;">
	  <tr>
		<td style="background: pink; color: #000; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 13px; padding: 10px 15px;">
			<pre style="-moz-tab-size: 2; -ms-hyphens: none; -o-tab-size: 2; -webkit-hyphens: none; color: #000; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 13px; hyphens: none; line-height: 1.5; overflow: auto; tab-size: 2; text-align: left; white-space: pre; word-break: break-all; word-spacing: normal; word-wrap: normal;">{{license}}</pre>
		</td>
	</tr>
</table>
<h3>License Setup Guide:</h3> <a href="https://add-reminders.gitbook.io/docs/guides/premium-license/how-to-set-up-your-license-on-rocket.chat-server">Click here for instructions on how to setup your license key</a>
<h3>A couple of important notes about your license key:</h3>
<ul>
<li>It's for workspace with URL: {{workspaceAddress}}</li>
<li>Its valid until: {{licenseExpiration}}</li>
<li>On your next renewal, we'd send you an another license key which should get replaced with this one. You can find more info about the renewal process <a href="https://add-reminders.gitbook.io/docs/guides/premium-license"> here</a>.</li>
</ul>

	<h4> Facing any problems?</h4>
	Feel free to contact us anytime at this email - <a href="mailto:contact@appsforchat.com">contact@appsforchat.com</a></li> - and we'd be happy to help you 🤗
<p style="font-size:0.9em;">Regards,<br />Reminder App Team</p>
  <hr style="border:none;border-top:1px solid #eee" />
</div>
</div>`;

export const newSubAddedEmailTemplateSubject =
  "New Reminder App Subscription was Added";
