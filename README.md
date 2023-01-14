# pic-to-calendar
## Extract appropriate date/time/name from image of schedule and automatically create calendar events for the schedule.

### Hi, this is a little project I created to help me automatically add my new schedules to my calendar via screenshot.

I get a new schedule every week, and inserting them in my calendar makes my life easier; however, doing so manually takes time.

Instead, I use an API that extracts the text from a screenshot of my schedule.
I then parse through the lines to find relavent data (i.e. dates/start/end times/event title.
I then add these events to a new .ics file which allows me to import that file in my calendar.
This automatically adds my new schedule to my calendar!

## Future Goals:
- [ ] Implement Google auth to add the new schedule without the use of .ics files.
- [ ] Add a GUI (i.e. website/app) that allows user to do this without a PC.
- [ ] Add ability to customize automation.
- [ ] Make the algorithm more tolerant of different types of image data (i.e. extract schedules from any image including school schedules).
- [ ] And beyond!!!
