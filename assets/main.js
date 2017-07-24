var campos_requeridos = [];
var CURRENT_TICKET = {};
var CURRENT_FORM = {};
var client = null;

$(document).ready(function() {
	client = ZAFClient.init();
	client.invoke('resize', { width: '100%', height: '420px' });
	menu();
});

function cria_ticket()
{
	var formulario = [];
	var currentTicketForm = CURRENT_FORM.ticket_form.ticket_field_ids;
	$.each(currentTicketForm, function(index,id)
	{
		if($('#'+id).val()!=undefined)
		{
			var i={};
			i['id']=id;
			i['value']=$('#'+id).val();
			formulario.push(i);
		}
	});
	
	var tags=CURRENT_TICKET.ticket.tags;
	tags[tags.length] = 'filho_'+CURRENT_TICKET.ticket.id;
	tags[tags.length] = 'filho';
	
	var settings = {
	url: '/api/v2/tickets.json',
	contentType:'application/json',
	type: 'POST',
	async: false,
	data: JSON.stringify(
		{
			ticket: {
				subject : $('#subject_id').val(),
				comment : { body: $('#description_id').val() },
				priority : $('#priority').val(),
				tags : tags,
				ticket_form_id : CURRENT_TICKET.ticket.ticket_form_id,
				brand_id : CURRENT_TICKET.ticket.brand_id,
				custom_fields: formulario
			}
		}
	)};	
	client.request(settings);
	settings = null;
	
	tags.pop();
	tags.pop();
	tags[tags.length] = 'pai';

	var settings = {
	url: '/api/v2/tickets/'+CURRENT_TICKET.ticket.id+'.json',
	contentType:'application/json',
	type: 'PUT',
	async: false,
	data: JSON.stringify(
		{
			ticket: {
				id : CURRENT_TICKET.ticket.id,
				tags : tags
			}
		}
	)};
	client.request(settings);
	settings = null;
	menu();
};

function clicou()
{
	ticketOrganize(client, function(data){
		showInfo(data);
		hideConditionals();
		requestCurrentTicket(client, function(data) {
			CURRENT_TICKET = data;
			$('#subject_id').val(" - FILHO DO " + data.ticket.id);
		});
	});
}

//this method fill all fields of the Son ticket using the father info.
function autoFillClick() {
	ticketOrganize(client, function(data){
		showInfo(data);
		hideConditionals();
		requestCurrentTicket(client, function(data) {			
			CURRENT_TICKET = data;
			
			//fill standard fields
			$('#subject_id').val(data.ticket.subject + " - FILHO DO " + data.ticket.id);
			$('#description_id').val(data.ticket.description);
			$('#stickettype_id').val(data.ticket.type);
			$('#priority_id').val(data.ticket.priority);
			
			//fill custom fields
			var allElems = document.getElementsByTagName("*");
			var allCustoms = data.ticket.custom_fields;
			for(i=0; i < allElems.length; i++){
				for(j=0; j < allCustoms.length; j++){
					if(allElems[i].id == allCustoms[j].id) {
						$('#'+allElems[i].id).val(allCustoms[j].value);
						if(allCustoms[j].value===true) {
							$('#'+allElems[i].id).prop("checked", true);
						}
						break;
					}
				}
			}
			//show filled fields...
			for(i=0; i < allCustoms.length; i++) {
				var innerValue = $('#'+allCustoms[i].id).val();
				if(innerValue!='' && innerValue!='-') {
					var el = document.getElementById('campo_'+allCustoms[i].id);
					if(el) {
						el.className = 'shown_box';
					}
				}
			}
			
		});
	});
}

function menu()
{
	var filhos=[];
	var pai=[];
	variavel=[];
	requestCurrentTicket(client, function(ticketAtual){
		
		
		var source = $("#menu").html();
		var template = Handlebars.compile(source);
		var html = template(variavel);
		$("#content").html(html);
		
		var settings = {
				url: '/api/v2/search.json?query=type:ticket tags:filho_'+ticketAtual.ticket.id,
				type:'GET',
				async: false,
				dataType: 'json',
			};
		client.request(settings).then(
			function(data)
			{
				if(data.count>0)
				{
					$.each(data.results, function(index,info)
					{
						var filho = {};
						filho['subject'] = info.subject;
						filho['id'] = info.id;
						filho['status'] = info.status;
						filho['url'] = 'https://tmfbrasil.zendesk.com/agent/tickets/'+info.id;
						filhos.push(filho);
					});
				}
				variavel.filhos=filhos;

				var source = $("#tickets_filho").html();
				var template = Handlebars.compile(source);
				var html = template(variavel);
				$("#box_filho").html(html);
			}
		);
		
		variavel=[];
		//console.log(variavel);
		tags=ticketAtual.ticket.tags;
		if(tags.indexOf('filho')!=(-1))
		{
			$.each(tags, function(index,tag)
			{
				if(tag.indexOf('filho_')!=(-1))
				{
					pai.id=tag.slice(6);
					var settings = {
							url: '/api/v2/tickets/'+pai.id+'.json',
							type:'GET',
							async: false,
							dataType: 'json',
						};
					client.request(settings).then(
						function(data)
						{
							var source = $("#tickets_pais").html();
							var template = Handlebars.compile(source);
							var html = template(data);
							$("#box_pai").html(html);

						}
					);
				}
			});
		}
	});
}

function showInfo(data)
{
	var source = $("#requester-template").html();
	var template = Handlebars.compile(source);
	var html = template(data);
	$("#content").html(html);
}

//Get the current ticket, if the app is ticket_sidebar.
//Do not return custom filds in the JSON, but it is quicker.
//This function also returns all information about the requester.
function getCurrentTicket(client, callback)
{
	client.get('ticket').then( function(data)
	{
		callback(data);
	},
	function(errorData)
	{
		console.log(errorData);
	});
}

//Request via API the current ticket, if the app is ticket_sidebar.
//Return current ticket in the JSON, but it is slower.
function requestCurrentTicket(client, callback) {
	client.get('ticket.id').then( function (ticket) {
		var settings = {
			url: '/api/v2/tickets/' + ticket['ticket.id'] + '.json',
			type:'GET',
			dataType: 'json',
		};
		client.request(settings).then(
			function(data) {
				callback(data);
			},
			function(errorData) {
				console.log(errorData);
		});
	});
};

//Request via API all tickets, if the app is ticket_sidebar.
//Return custom fields in the JSON, but it is slower.
function requestAllTickets(client, callback) {
	var settings = {
		url: '/api/v2/tickets.json',
		type:'GET',
		dataType: 'json',
	};
	client.request(settings).then(
		function(data) {
			callback(data);
		},
		function(errorData) {
			console.log(errorData);
	});
};

//Request via API the current ticket requester, if the app is ticket_sidebar.
//Return data into JSON.
function requestCurrentRequester(client, callback) {
	client.get('ticket.requester.id').then( function (ticket) {
		var settings = {
			url: '/api/v2/users/' + ticket['ticket.requester.id'] + '.json',
			type:'GET',
			dataType: 'json',
		};	
		client.request(settings).then(
			function(data) {
				callback(data);
			},
			function(errorData) {
				console.log(errorData);
		});
	});
};

//Request via API the current ticket form, if the app is ticket_sidebar and app has the version that enable multiple forms.
//Return data into JSON.
function requestCurrentForm(client, callback) {
	client.get('ticket.form.id').then( function (ticket) {
		var settings = {
			url: '/api/v2/ticket_forms/' + ticket['ticket.form.id'] + '.json',
			type:'GET',
			dataType: 'json',
		};	
		client.request(settings).then(
			function(data) {
				callback(data);
			},
			function(errorData) {
				console.log(errorData);
		});
	});
};

//Request via API all the fields in the current org.
//Return data into JSON.
function requestAllTicketFields(client, callback) {
	var settings = {
		url: '/api/v2/ticket_fields.json',
		type:'GET',
		dataType: 'json',
	};	
	client.request(settings).then(
		function(data) {
			callback(data);
		},
		function(errorData) {
			console.log(errorData);
	});
};

//function to organize the current form into a JSON with all info
function ticketOrganize(client, callback) {
	campos_requeridos = [];
	//empty variable for organized ticket form with all info
	campos_requeridos.push("subject_id");
	campos_requeridos.push("description_id");
	
	var formatedTicketForm = {
		ticket_fields : []
	};
	requestAllTicketFields(client, function(data) {
		var allFields = data;
		requestCurrentForm(client, function(data) {
			var currentTicketForm = data;
			CURRENT_FORM = data;
			for(i=0; i < currentTicketForm.ticket_form.ticket_field_ids.length; i++){
				for(j=0; j< allFields.ticket_fields.length; j++) {
					if(currentTicketForm.ticket_form.ticket_field_ids[i] == allFields.ticket_fields[j].id)
					{
						if(allFields.ticket_fields[j].required===true)
						{
							campos_requeridos.push(allFields.ticket_fields[j].id);
						}
						formatedTicketForm.ticket_fields.push(allFields.ticket_fields[j]);							
					}
				}
			}
			callback(formatedTicketForm);		
		});
	});
}

//this method is used to hide all "hidden by default" fields
function hideConditionals() {
	var allElements = document.getElementsByTagName("*");
	//get all ids in the document
	var allIds = [];
	for (var i = 0, n = allElements.length; i < n; ++i) {
		var el = allElements[i];
		if (el.id) { allIds.push(el.id); }
	}
	//hide all defalut hidden fields
	for (i=0; i < cfaRules.length; i++) {
		for(j=0; j < cfaRules[i].select.length; j++) {
			var el = document.getElementById('campo_'+cfaRules[i].select[j]);
			if(el) {
				el.className = 'hidden_box';
			}
		}
	}
}

//this method is used to show all conditional fields when pick selection is used
function onPickSelect(field_id, field_value) {

	//call the recursive function to hide all conditional sons in the whole tree
	var newStack = [];
	newStack[newStack.length] = field_id;	
	hideSomething(newStack);
	
	//now run through again and show only if the id and value match
	for (i=0; i < cfaRules.length; i++) {
		if(field_id==cfaRules[i].field && field_value==cfaRules[i].value) {
			for(j=0; j < cfaRules[i].select.length; j++) {
				var el = document.getElementById('campo_'+cfaRules[i].select[j]);
				if(el) {
					el.className = 'shown_box';
				}
			}
		}
	}
}

//recursive function to hide all the tree of conditional fields
//the parameter needs to be a stack of Ids
function hideSomething(newStack) {
	var anotherStack = [];
	
	if(newStack.length>0) {
		for(z=0; z < newStack.length; z++) {
			for (i=0; i < cfaRules.length; i++) {
				if(newStack[z]==cfaRules[i].field) {
					for(j=0; j < cfaRules[i].select.length; j++) {
						var el = document.getElementById('campo_' + cfaRules[i].select[j]);
						if(el) {
							el.className = 'hidden_box';
						}
						//hide values if hide field
						$('#'+cfaRules[i].select[j]).val('');
						//build another stack to check
						anotherStack[anotherStack.length] = cfaRules[i].select[j];
					}
				}
			}
		}
	}	
	if(anotherStack.length>0) {
		hideSomething(anotherStack);
	}
}

function valida_campos_requeridos()
{
	var error=false;
	$.each(campos_requeridos, function(index,id)
	{
		if($('#'+id).val()=="")
		{
			$('#error_'+id).html('Atenção, este campo é obrigatório.');
			console.log(id);
			$('#'+id).focus();
			error=true;
		}
		else
		{
			$('#error_'+id).html('');
		}
	});
	if(!error)
	{
		cria_ticket();	
	}
}

//Handlebars function to coditional if v1 equals v2
Handlebars.registerHelper('ifEquals', function(v1, v2, options) {
	if(v1 == v2)
	{
		return options.fn(this);
	}
	return options.inverse(this);
});