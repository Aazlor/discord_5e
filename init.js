const Discord = require('discord.js');						//Discord.js
const fs = require('fs');									//Node.js File System
const { Client, MessageEmbed } = require('discord.js');		// Extract the required classes from the discord.js module
const client = new Discord.Client();


const combat_obj = {}

/***** FUNCTION LISTS *****/
	function rollDie(sides) {
		return Math.floor(Math.random() * Math.floor(sides)) + 1;
	}
	function hashCode(str) { // java String#hashCode
		var hash = 0;
		for (var i = 0; i < str.length; i++)
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		return hash;
	}
	function intToRGB(i){
		var c = (i & 0x00FFFFFF).toString(16).toUpperCase();
		return "00000".substring(0, 6 - c.length) + c;
	}
	function rollInit(message){

		var msg = message.content.replace(/!/gim, '');

		var count = 0;
		var rt_msg = ''; //msg;

		// var modifier = msg.replace(/\D/g, '');
		var modifier = msg.match(/(\-|\+)\d+/gi);
		console.log('modifier: ' + modifier)
		
		if(msg.includes("adv") || msg.includes("dis")){
			rt_msg += (msg.includes("adv")) ? 'd20 adv' : 'd20 dis';
			var srt = [];

			var roll1 = rollDie(20);
			var roll2 = rollDie(20);

			if(msg.includes("adv")){
				var roll = (roll1 > roll2) ? roll1 : roll2;
				rt_msg += (roll1 >= roll2) ? ' [**'+roll1+'**,'+roll2+'] ' :  ' ['+roll1+',**'+roll2+'**] ';
			}
			else{
				var roll = (roll1 < roll2) ? roll1 : roll2;
				rt_msg += (roll1 <= roll2) ? ' [**'+roll1+'**,'+roll2+'] ' :  ' ['+roll1+',**'+roll2+'**] ';
			}
		}
		else{
			var roll = rollDie(20);
			rt_msg += ' d20['+roll+'] ';
		}

		if(!Number.isInteger(parseInt(modifier))){
			modifier = 0;
			rt_msg += '+0';
		}
		else{
			modifier = (msg.includes('-')) ? -Math.abs(parseInt(modifier)) : parseInt(modifier)
			rt_msg += modifier;
		}
		count = roll + modifier;

		return {
			modifier: modifier,
			count: count,
			msg: '**'+count+'** ('+rt_msg+')'
		}
	}
	async function display(message){

		var channel_id = message.channel.id;
		var init = combat_obj[channel_id]['initiative'];
		var count = Object.keys(init).length;

		const embed = new MessageEmbed();

		if(count > 0){
			var list = [];

			for (const [key, value] of Object.entries(init)) {
				list.push([key, value[0], value[1], value[2]]);
			}

			list.sort(function(a, b) { 
				return a[1] - b[1] || a[2] - b[2];
			})

			embed
				.setTitle('INITIATIVE ORDER')
				.setColor(message.guild.me.displayHexColor)
				.setThumbnail('https://images-na.ssl-images-amazon.com/images/I/51pWdRWIzzL._AC_.jpg')

			var description = '';

			for (var i = list.length - 1; i >= 0; i--) {

				if(/^\d+$/.test(list[i][0]))
					var nickname = message.guild.members.cache.get(list[i][0]).nickname
				else
					var nickname = list[i][0]

				if(nickname == null)
					var nickname = message.guild.members.cache.get(list[i][0]).user.username

				if(list[i][3] === true){
					console.log(true)
					description += '~~**'+list[i][1]+'** '+ nickname+"~~\r\n";
				}
				else{
					console.log(false)
					description += '**'+list[i][1]+'** '+ nickname+"\r\n";
				}
				// embed.addField('Going Now', nickname)

			}
				// Display
				embed.setDescription(description);
		}
		else{
			embed
				.setTitle('ROLL INITIATIVE!')
				.setColor(message.guild.me.displayHexColor)
				.setThumbnail('https://images-na.ssl-images-amazon.com/images/I/51pWdRWIzzL._AC_.jpg')
		}
		message.channel.send(embed).then(sent => { // 'sent' is that message you just sent
			sent.pin()

			message.channel.messages.fetch(combat_obj[channel_id]['message_id']).then(msg => {
				msg.delete();
			}).catch(function (err) {
				console.log(err);
			});

			combat_obj[channel_id]['message_id'] = sent.id;
		}).catch(function (err) {
			console.log(err);
			message.channel.send(err);
		});	
	}

/*****  START  *****/
client.once('ready', () => {
	console.log('ROLL INITIATIVE!');
});

client.on('message', message => {
	if(message.type === "PINS_ADD") return message.delete();

	if(message.author.bot) return;

	if(message.guild === null) return console.log(message)

	const server_id = message.guild.id;
	const channel_id = message.channel.id;
	const fileName = 'servers/initiative/'+server_id+'.json';

	if(combat_obj[channel_id] === undefined) combat_obj[channel_id] = {}

	console.log(combat_obj[channel_id])

	/***** COMMAND LISTS - TO DO
		const commands = [
			'!DM',
			'i',
			'!i',
			'-i',
		];
		const DM_only_commands = [
			'--s',
			'!PURGE',
			'-init',
			'!init',
		];

		/*****
		const commands = {
			DM: [
				'!PURGE',
				'%init',
			],
			PLAYER: [

			],
		}
	*****/

	if(Object.keys(combat_obj[channel_id]).length === 0 && combat_obj.constructor === Object){
		console.log('bollox')
		combat_obj[channel_id] = {
			DM: '',
			channel_id: channel_id,
			initiative: {},
			message_id: '',
			stealth: 0,
			in_combat: 0,
		};
	}

	//SETUP DM
	if(message.content == '!DM'){
		/**						If DM is defined, request for DM to relenquish DM-hood and instate new user 					**/
		// message.delete();
		combat_obj[channel_id]['DM'] = message.author.id;
		message.reply('DUNGEON MASTER MODE ACTIVATED - Please use responsibly.')
		return
	}

	//DM COMMANDS
	if(combat_obj[channel_id]['DM'] == message.author.id){
		///// DM STEALTH MODE
		if(combat_obj[channel_id]['stealth'] == 1)
			message.delete();
		///// PURGE
		if(message.content.startsWith('!PURGE')){
			message.delete();

			if(message.member.hasPermission('MANAGE_MESSAGES') === false) return message.reply('Permission Denied');

			const args = message.content.split(' ').slice(1); // All arguments behind the command name with the prefix
			const amount = args.join(' '); // Amount of messages which should be deleted

			if (!amount) return message.reply('Specify number of messages to delete.'); // Checks if the `amount` parameter is given
			if (isNaN(amount)) return message.reply('Not a number!  Try again.'); // Checks if the `amount` parameter is a number. If not, the command throws an error

			if (amount > 100) return message.reply('Maximum limit of 100 messages at once!'); // Checks if the `amount` integer is bigger than 100
			if (amount < 1) return message.reply('Minimum of at least 1 message!'); // Checks if the `amount` integer is smaller than 1

			message.channel.messages.fetch({ limit: amount }).then(messages => { // Fetches the messages
				message.channel.bulkDelete(messages // Bulk deletes all messages that have been fetched and are not older than 14 days (due to the Discord API)
			)}).catch(function () {
				console.log("PURGE Promise Rejected");
				message.channel.send("PURGE Promise Rejected");
			});
		}
		else if(message.content == '!stealth'){
			message.delete();
			combat_obj[channel_id]['stealth'] = Math.abs(combat_obj[channel_id]['stealth'] - 1);
			var send_message = (combat_obj[channel_id]['stealth'] == 1) ? "DM Stealth Mode On." : "DM Stealth Mode Off";
			message.author.send(send_message)
		}
		else if(message.content == '-init' || message.content == '!init'){
			message.delete();
			combat_obj[channel_id]['in_combat'] = 1;
			display(message);
		}
		else if(message.content == '!end'){
			message.channel.messages.fetch(combat_obj[channel_id]['message_id']).then(msg => {
				msg.delete();
				combat_obj[channel_id]['in_combat'] = 0;
				combat_obj[channel_id]['initiative'] = {};
			}).catch(function (err) {
				console.log(err + "  -  End Combat Promise Rejected");
				message.channel.send(err + "  -  End Combat Promise Rejected");
			});
			message.delete();
			message.channel.send('**INITIATIVE TRACKING DEACTIVATED**')
		}
		else if (message.content.startsWith("i") || message.content.startsWith("!i") || message.content.startsWith("-i")){

			if(combat_obj[channel_id]['in_combat'] != 1)
				return

			var name = message.content.match(/(?<=i\s+).*?(?=\s*(\-|\+|adv|dis|$))/gsi)

			if(message.content.match(/^.*?(i dead)/gsi)){
				var name = message.content.match(/(?<=i dead.*?\s+).*?(?=\s*(\-|\+|adv|dis|$))/gsi)
				console.log('~~~ '+name+' ~~~')
				console.log(combat_obj[channel_id].initiative[name])
				if(combat_obj[channel_id].initiative.hasOwnProperty(name))
					combat_obj[channel_id].initiative[name][2] = true;
				display(message);
			}
			else if(message.content.match(/^.*?(i del|i rem)/gsi)){
				var name = message.content.match(/(?<=i [r|d].*?\s+).*?(?=\s*(\-|\+|adv|dis|$))/gsi)
				if(combat_obj[channel_id].initiative.hasOwnProperty(name))
					delete combat_obj[channel_id].initiative[name]
				display(message);
			}
			else {
				if(name == null){
					message.delete();
					display(message);
					return;
				}
				var init_results = rollInit(message);
				console.log(init_results)

				combat_obj[channel_id]['initiative'][name] = [init_results.count, init_results.modifier, false];
				display(message);
			}
		}

		return;
	}
	else if(combat_obj[channel_id]['in_combat'] == 1){
		if(message.content.startsWith('i') || message.content.startsWith('!i') || message.content.startsWith('!i')){
			var init_results = rollInit(message);
			combat_obj[channel_id]['initiative'][message.author.id] = [init_results.count, init_results.modifier];
			message.reply('Initiative: '+init_results.msg)
			display(message);
		}
	}
});


client.login('NzI1MjE5NjgyMjU2MTU4Nzcw.XveTdA.TdhKSF6MmscD92KmGTFg-K7owwA');