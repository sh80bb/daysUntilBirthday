# Scriptable Script: daysUntilBirthday
- Script for the iOS App Scriptable
- up to 20 people of your contacts are shown simultaneously with their birthday and how many days are left
- contacts are sorted by how far away their birthday is (nearest first)


# How to use
- in your contacts app, edit the contacts you want to be visible in this widget
- you need to set up an additional 'date' field in your contact and give the date the label '**daysUntilBirthday**'
- run the script initially in the Scriptable app to create a **json file in iCloud** containing contact information for faster access
- when you add new contacts via the label, run the script again in the app to update the json! This makes the changes visible in iCloud-mode
- when setting the script up as **Widget**, use the **largest presentation mode** and **provide the parameter 'iCloud'** (without the ' ')
- if contacts have a nickname set, the **nickname will be chosen**
- if the name contains a space character, only the part before the first space is used (in case of a nickname like 'Julian ❤️' the name in this widget will be 'Julian')


# Contact Setup
- provide all the contacts you want to see with a new date
- give the date the label 'daysUntilBirthday'
- an actual birthday set in the regular birthday field is not necessary



![](contactSetup.gif)

# Widget Setup
- when using parameter iCloud the contacts are not scanned and the source at the bottom changes to 'iCloud'


![](setupWidget.gif)

# Language
- you can easily edit the parameter at the top of the script to show the text you like
- example in english:



![](fullySetupWidget.PNG)