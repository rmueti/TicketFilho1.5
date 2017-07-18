//Function to format dates
function formatDate(date)
{
	var cdate = new Date(date);
	var options = {
		year: "numeric",
		month: "short",
		day: "numeric"
	};
	date = cdate.toLocaleDateString("en-us", options);
	return date;
}

function showhide(id)
{
	var e = document.getElementById(id);
	e.style.display = (e.style.display == 'block') ? 'none' : 'block';
}