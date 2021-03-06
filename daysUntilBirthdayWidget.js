//////////////////////////////////
// how to use:
// in your contacts app, edit the contacts you want to be visible in this widget
// -> you need to set up an additional 'date' field in your contact and give the date the label 'daysUntilBirthday'
// run the script initially in the Scriptable app to create a json file in iCloud containing contact information for faster access
// when you add new contacts via the label, run the script again in the app to update the json and make the changes visible in iCloud-mode
// when setting the script up as Widget, use the largest presentation mode and provide the parameter 'iCloud' (without the '')
//////////////////////////////////

// the label name you need to set in contacts on the first date field
const contactNotesKeyWord = 'daysUntilBirthday';

//////////////////////////////////
// edit these according to your language
const daysUntilBirthdayText = 'Tage bis zum Geburtstag von';
const daysText = 'Tage';
const todayText = 'Heute!';
//////////////////////////////////

const dateFormatter = new DateFormatter();
dateFormatter.dateFormat = 'dd.MM.yyyy';
const timeFormatter = new DateFormatter();
timeFormatter.dateFormat = 'dd.MM.yyyy HH:mm:ss';

const headerFont = new Font('Menlo-regular', 14);
const contactNameFont = new Font('Menlo-regular', 17);
const smallInfoFont = new Font('Menlo-regular', 10);
const updatedAtFont = new Font('Menlo-regular', 7);
const fontColorGrey = new Color("#918A8A");
const fontColorWhite = new Color("#FFFFFF");

// used for inserting space characters
const lineLength = 7;

// class that is also serialized to a json file in iCloud
class CustomContact {
    constructor(name, daysUntil, date) {
        this.name = name;
        this.daysUntil = daysUntil;
        this.date = date;
    }

    getAsKey() {
        // name and daysUntil together make the contact unique
        return this.name + '-' + this.daysUntil;
    }
}


const widget = await createWidget();
widget.backgroundColor = new Color("#000000");
if (!config.runsInWidget) {
    await widget.presentLarge();
}

Script.setWidget(widget);
Script.complete();

async function createWidget() {
    const widget = new ListWidget();
    let headerRow = widget.addStack();
    let headerText = headerRow.addText(daysUntilBirthdayText);
    headerText.textColor = fontColorGrey;
    headerText.font = headerFont;

    let shownCustomContacts = [];
    let dataSource = '';

    // enter 'iCloud' without the '' as parameter when setting up the script as a widget
    if (args.widgetParameter && args.widgetParameter.startsWith('iCloud')) {
        dataSource = 'iCloud';
        shownCustomContacts = loadCustomContacts();
        updateCustomContacts(shownCustomContacts);
    } else {
        dataSource = 'iPhone';

        let containers = await ContactsContainer.all();
        let contactsInIos = await Contact.all(containers);

        let keysForDuplicatePrevention = [];
        for (let contact of contactsInIos) {
            // contacts need to have an additional date property named like the content of variable contactNotesKeyWord
            if (contact.dates[0] && contact.dates[0].label.startsWith(contactNotesKeyWord)) {
                // the shorter nickname is preferred
                let contactsName = contact.nickname ? contact.nickname : contact.givenName;
                // next line removes emoji that come after a space character
                contactsName = contactsName.split(' ')[0];
                let foundContact = new CustomContact(contactsName, calculateDaysUntil(contact.dates[0].value), dateFormatter.string(new Date(contact.dates[0].value)));

                // check if already found before (in case of multiple contact containers)
                if (!keysForDuplicatePrevention.includes(foundContact.getAsKey())) {
                    keysForDuplicatePrevention.push(foundContact.getAsKey());
                    shownCustomContacts.push(foundContact);
                }
            }
        }
    }

    // sorts contacts by how near their birthday is
    shownCustomContacts.sort(function (a, b) {
        return a.daysUntil > b.daysUntil;
    });

    // write back to json in iCloud
    saveCustomContacts(shownCustomContacts);

    // this row consists of two customContact infos
    let currentRow;
    // counter for creating two columns and a maximum of 20 visible contacts
    let contactCounter = 0;
    for (let customContact of shownCustomContacts) {
        if (contactCounter === 20) {
            // only the top 20 earliest birthdays are shown in the widget
            break;
        }
        if (contactCounter % 2 === 0) {
            // start a new row
            currentRow = widget.addStack();
        }
        addContactInfoToRow(customContact, currentRow);
        contactCounter++;
        if (contactCounter < 20) {
            widget.addSpacer(1);
        }
    }

    let updatedAt = widget.addText('Source: ' + dataSource + ', Update: ' + timeFormatter.string(new Date()));
    updatedAt.font = updatedAtFont;
    updatedAt.textColor = fontColorWhite;
    updatedAt.centerAlignText();
    return widget;
}

// used to align the information
function addSpaces(amount, row) {
    for (let i = 0; i < amount; i++) {
        let text = row.addText(' ');
        text.font = contactNameFont;
    }
}

function addContactInfoToRow(customContact, row) {
    addSpaces(lineLength - customContact.name.length, row);
    let nameRow = row.addText(customContact.name);
    nameRow.font = contactNameFont;
    nameRow.textColor = fontColorWhite;

    let actualText = customContact.daysUntil === 0 ? ' ' + todayText + '\n ' + customContact.date : ' ' + customContact.daysUntil + ' ' + daysText + '\n ' + customContact.date;
    let daysInfoText = row.addText(actualText);
    daysInfoText.textColor = fontColorGrey;
    daysInfoText.font = smallInfoFont;
}

function calculateDaysUntil(birthdayString) {
    let startDate = new Date();
    let targetDate = new Date(birthdayString);
    targetDate.setFullYear(startDate.getFullYear());

    let timeRemaining = parseInt((targetDate.getTime() - startDate.getTime()) / 1000);

    if (timeRemaining < 0) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
    }

    timeRemaining = parseInt((targetDate.getTime() - startDate.getTime()) / 1000);
    if (timeRemaining >= 0) {
        let days = 1 + parseInt(timeRemaining / 86400);
        return parseInt(days, 10) % 365;
    } else {
        return '???';
    }
}

// recalculates the daysUntil value of the customContacts
function updateCustomContacts(customContacts) {
    for (let contact of customContacts) {
        contact.daysUntil = calculateDaysUntil(dateFormatter.date(contact.date).toString());
    }
}

// loads contacts stored in the json
function loadCustomContacts() {
    // this could be changed to FileManager.local() if you don't want to use iCloud
    let fm = FileManager.iCloud();
    let path = getFilePath();
    if (fm.fileExists(path)) {
        let raw = fm.readString(path);
        return JSON.parse(raw);
    } else {
        return [];
    }
}

// Saves the CustomContacts to a file in iCloud Drive.
function saveCustomContacts(customContacts) {
    // this could be changed to FileManager.local() if you don't want to use iCloud
    let fm = FileManager.iCloud();
    let path = getFilePath();
    let raw = JSON.stringify(customContacts);
    fm.writeString(path, raw);
}

// Gets path of the file containing the stored CustomContact  data. Creates the file if necessary.
function getFilePath() {
    let fm = FileManager.iCloud();
    let dirPath = fm.joinPath(fm.documentsDirectory(), "daysUntilBirthdayData");
    if (!fm.fileExists(dirPath)) {
        fm.createDirectory(dirPath);
    }
    return fm.joinPath(dirPath, "customContacts.json");
}
