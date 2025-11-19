call conda activate atagspace
call python app.py extension tagspaces_export -s
if not "%~1" == "nopause" pause
