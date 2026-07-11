import random
import string
import uuid

POSITIONS = ["前端", "后端", "产品", "运营", "财务", "人事", "设计师", "测试", "自由职业"]
AREAS = ["靠窗黄金区", "普通办公区", "角落摸鱼区", "地下加班区"]
STATUSES = ["认真敲代码", "带薪发呆", "偷偷刷短视频", "假装开会", "摸鱼刷论坛", "疯狂内卷加班"]

AVATAR_COLORS = [
    "#4F46E5", "#7C3AED", "#EC4899", "#EF4444", "#F97316",
    "#EAB308", "#22C55E", "#14B8A6", "#06B6D4", "#3B82F6",
    "#8B5CF6", "#DB2777", "#DC2626", "#EA580C", "#65A30D",
]

AI_NAMES = [
    "张小明", "李小红", "王大伟", "赵美丽", "刘华强",
    "陈静静", "杨帆", "周小星", "吴佳佳", "郑浩然",
    "孙晓晓", "马超", "朱婷婷", "胡建国", "林小雨",
    "何阳光", "罗思琪", "梁志强", "宋小宝", "唐甜甜",
]

BOSS_EVENTS = [
    {"type": "表扬", "content": "老板拍了拍你的肩膀：\"干得不错，继续加油！\"", "reputation": 10},
    {"type": "画饼", "content": "老板：\"好好干，明年给你涨薪升职，公司不会亏待你的！\"", "reputation": 0},
    {"type": "加班通知", "content": "老板：\"这个项目比较急，今晚大家加个班吧，有加班费的...吧\"", "reputation": -5},
    {"type": "团建邀请", "content": "老板：\"周末一起去团建吧，费用AA，不来的算旷工哦~\"", "reputation": -3},
    {"type": "发红包", "content": "老板发了个大红包：\"大家辛苦了，买点奶茶喝！\"", "reputation": 15},
    {"type": "批评", "content": "老板皱着眉：\"这个方案不行，重做！明天早上给我新的。\"", "reputation": -10},
    {"type": "摸鱼被抓", "content": "老板出现在你身后：\"上班时间刷手机？来我办公室一趟！\"", "reputation": -15},
    {"type": "偶遇", "content": "你和老板在走廊擦肩而过，老板点了点头", "reputation": 2},
    {"type": "聊家常", "content": "老板和你聊起了家常，还问你有没有对象...", "reputation": 5},
    {"type": "项目奖金", "content": "老板：\"项目上线了！给你发项目奖金，继续努力！\"", "reputation": 20},
]


def generate_session_id() -> str:
    """生成会话ID"""
    return str(uuid.uuid4())


def get_random_position() -> str:
    return random.choice(POSITIONS)


def get_random_area() -> str:
    return random.choice(AREAS)


def get_random_status() -> str:
    return random.choice(STATUSES)


def get_random_avatar_color() -> str:
    return random.choice(AVATAR_COLORS)


def get_random_ai_name() -> str:
    return random.choice(AI_NAMES)


def get_random_boss_event() -> dict:
    return random.choice(BOSS_EVENTS)


def validate_position(position: str) -> bool:
    return position in POSITIONS


def validate_area(area: str) -> bool:
    return area in AREAS


def validate_status(status: str) -> bool:
    return status in STATUSES


def can_access_area(reputation: int, area: str) -> bool:
    """检查用户是否可以访问指定区域"""
    if area == "靠窗黄金区" and reputation < 80:
        return False
    if area == "地下加班区" and reputation < 20:
        return True
    return True


def generate_random_note() -> str:
    """生成随机AI便签"""
    notes = [
        "今天的咖啡真好喝~",
        "又要开会了，唉",
        "这个需求什么时候能做完啊",
        "摸鱼中，勿扰",
        "代码写不出来...",
        "好想下班回家",
        "今天的外卖好好吃",
        "产品经理又改需求了！",
        "后端的接口又挂了",
        "前端的bug真多",
        "周五了！周末快乐！",
        "周一上班真痛苦",
        "老板又画饼了",
        "年终奖什么时候发",
        "这个bug到底怎么回事",
        "设计师的审美我不懂",
        "运营的数据有点差",
        "财务报销真麻烦",
        "人事又要招人了",
        "测试又提bug了",
    ]
    return random.choice(notes)


def generate_random_complaint() -> str:
    """生成随机AI吐槽"""
    complaints = [
        "我真的服了这个需求，改了八百遍了，产品经理能不能一次说清楚！",
        "天天加班，工资还这么低，什么时候是个头啊...",
        "刚才那个会议开了两个小时，最后啥也没决定，纯纯浪费时间！",
        "同事又甩锅给我，明明是他的问题好吗？！",
        "食堂的饭越来越难吃了，价格还涨了，无语",
        "老板今天又画饼了，说什么年底分红，我信你个鬼",
        "这个bug我找了一天了，结果是个拼写错误，我要疯了",
        "为什么周五下午总是会有新需求？就不能让我好好过周末吗？",
        "职场真的好累，每天都要应付各种人际关系",
        "说好的弹性工作制呢？为什么只弹上班时间不弹下班时间？",
    ]
    return random.choice(complaints)
