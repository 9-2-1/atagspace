call conda activate atagspace
call python app.py extension sorttag
if not "%~1" == "nopause" pause
