call conda activate atagspace
call python app.py extension totag -s
if not "%~1" == "nopause" pause
