SENSITIVE_WORDS = [
    "傻逼", "操你", "草你", "妈的", "他妈的", "狗娘", "贱人", "婊子",
    "嫖娼", "卖淫", "色情", "黄色", "强奸", "强暴", "猥亵", "性骚扰",
    "毒品", "吸毒", "贩毒", "海洛因", "大麻", "冰毒",
    "赌博", "赌钱", "赌场",
    "自杀", "自残",
    "恐怖", "恐怖分子", "爆炸",
    "诈骗", "传销", "非法集资",
    "政治敏感词", "反动",
    "垃圾", "废物", "白痴", "智障", "弱智",
    "去死", "该死", "王八蛋", "龟儿子",
]


def filter_sensitive_words(text: str) -> tuple[str, bool]:
    """
    过滤敏感词
    返回: (过滤后的文本, 是否包含敏感词)
    """
    contains_sensitive = False
    filtered_text = text

    for word in SENSITIVE_WORDS:
        if word in filtered_text:
            contains_sensitive = True
            replacement = "*" * len(word)
            filtered_text = filtered_text.replace(word, replacement)

    return filtered_text, contains_sensitive


def contains_sensitive_word(text: str) -> bool:
    """检查文本是否包含敏感词"""
    for word in SENSITIVE_WORDS:
        if word in text:
            return True
    return False
