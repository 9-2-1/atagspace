call conda activate atagspace
python app.py tagfile updatenew
python app.py extension totag -c
python app.py extension sorttag
if not "%~1" == "nopause" pause
