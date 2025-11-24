import sys

with open("moverule.txt", "w", encoding="utf-8") as f:
    stdout = sys.stdout
    sys.stdout = f
    tags = (
        "常用-负面 负面-争议话题 负面-推广 负面-观猴 负面-锤人 负面-高中 负面事件 事件 纪念-CTF"
        " 纪念-Scratch 纪念-Scratch-负面 纪念-种子杯 纪念-其他编程 纪念-大学 纪念-高中 娱乐-动画 娱乐-游戏"
        " 娱乐-动画推荐 娱乐-游戏推荐 娱乐-漫画推荐 娱乐-故事推荐 应用推荐 娱乐-up 主题"
        " 主题-计算机 搞笑合集 应用 特别 字体"
    ).split(" ")

    print(
        """\
+!重要文件 = /OneDrive/重要文件
+!难下载 = /下载/难下载
~常用 = /OneDrive/常用/{常用}
~重要-证书 = /OneDrive/重要-证书/
"""
    )

    print(
        """\
# Pictures / Videos
"""
    )

    PICTURES = "( *.jpg | *.png | *.jpeg | *.gif | *.mp4 )"

    for tag in tags:
        print(f"{PICTURES} ~{tag} = /Saved Pictures/{tag}/{{{tag}}}")
    print()

    print(
        f"""
{PICTURES} ( +!优先-1 | +!奇葩-1 | +!搞笑-1 | +!抽象-1 | +!优秀-1 | +!封神-1 ) = /Saved Pictures/!精选/
"""
    )

    for tag in "!待分类 !待更新 !待阅读 !持续关注".split(" "):
        print(f"{PICTURES} +{tag} = /Saved Pictures/{tag}")
    print()

    print(
        """\
# Other
"""
    )

    for tag in tags:
        print(f"~{tag} = /下载/{tag}/{{{tag}}}")
    print()

    print(
        f"""
( +!优先-1 | +!奇葩-1 | +!搞笑-1 | +!抽象-1 | +!优秀-1 | +!封神-1 ) = /下载/!精选/
"""
    )

    for tag in "!待分类 !待更新 !待阅读 !持续关注".split(" "):
        print(f"+{tag} = /下载/{tag}")
    print()

    print(
        """\
+!不安全 = /下载/!不安全
+!不重要 = /下载/!不重要
+!准备删除 = /下载/!准备删除
"""
    )

    sys.stdout = stdout
