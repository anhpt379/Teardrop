#! coding: utf-8
# pylint: disable-msg=W0311
import Image
import ImageDraw
import ImageFont
import ImageEnhance
from cStringIO import StringIO
from mimemagic import from_buffer as mimetype


def is_image(filedata):
  res = mimetype(filedata[:1024], mime=True)
  if res.startswith("image"):
    return True
  return False



def thumb_w(filedata, width):
  """Make thumbnail with white background, ratio fixed by origin.
  Return a file object"""
  if not filedata:
    return None

  if not is_image(filedata):
    return None

  try:
    img_fp = StringIO(filedata)
    output = StringIO()

    img = Image.open(img_fp)
    img_format = img.format
    if img_format not in ["BMP", "GIF", "PNG", "PPM", "JPEG"]:
      return None

    if img.mode != "RGB":
      img = img.convert("RGB")

    height = int(width * float(img.size[1]) / img.size[0])
    img = img.resize((width, height), Image.ANTIALIAS)

    if img_format == "GIF":
      img = img.convert("P", dither=Image.NONE, palette=Image.ADAPTIVE)

    img.save(output, img_format, quality=90)
    filedata = output.getvalue()
    return filedata
  except (IOError, IndexError, SyntaxError):
    return False
  finally:
    img_fp.close()
    output.close()


def thumb_wl(filedata, width):
  """ Make thumbnail with white background, if height > 2 * width -> crop.
  Return a file object"""
  if not filedata:
    return None

  if not is_image(filedata):
    return None

  try:
    img_fp = StringIO(filedata)
    output = StringIO()

    img = Image.open(img_fp)

    img_format = img.format
    if img_format not in ["BMP", "GIF", "PNG", "PPM", "JPEG"]:
      return None

    if img.mode != "RGB":
      img = img.convert("RGB")
    height = int(width * float(img.size[1]) / img.size[0])
    img = img.resize((width, height), Image.ANTIALIAS)

    if img.size[1] / img.size[0] >= 2:
      # crop image, put box in center of image
      left = 0
      right = img.size[0]
      upper = img.size[1] / 2 - width
      lower = img.size[1] / 2 + width
      img = img.crop((left, upper, right, lower))

    if img_format == "GIF":
      img = img.convert("P", dither=Image.NONE, palette=Image.ADAPTIVE)

    img.save(output, img_format, quality=90)
    filedata = output.getvalue()
    return filedata
  except (IOError, IndexError, SyntaxError):   # truncated image
    return False
  finally:
    img_fp.close()
    output.close()



def crop(filedata, width, height):
  if not filedata:
    return None

  if not is_image(filedata):
    return None

  try:
    img_fp = StringIO(filedata)
    output = StringIO()

    img = Image.open(img_fp)
    img_format = img.format
    if img_format not in ["BMP", "GIF", "PNG", "PPM", "JPEG"]:
      return None
    new_size = (width, int(img.size[1] * width / img.size[0]))
    if img.mode != "RGB":
      img = img.convert("RGB")
    img = img.resize(new_size, Image.ANTIALIAS)

    # crop image, put box in center of image
    left = 0
    right = img.size[0]
    upper = img.size[1] / 2 - width / 2
    lower = img.size[1] / 2 + width / 2
    img = img.crop((left, upper, right, lower))

    if img_format == "GIF":
      img = img.convert("P", dither=Image.NONE, palette=Image.ADAPTIVE)

    img.save(output, img_format, quality=93)
    filedata = output.getvalue()
    return filedata
  except (IOError, IndexError, SyntaxError):
    return False
  finally:
    img_fp.close()
    output.close()


def zoom(filedata, x, y):
  """TODO: nếu x, y lớn hơn kích thước gốc thì sai"""
  if not filedata:
    return None

  if not is_image(filedata):
    return None

  try:
    img_fp = StringIO(filedata)
    output = StringIO()

    img = Image.open(img_fp)
    img_format = img.format
    if img_format not in ["BMP", "GIF", "PNG", "PPM", "JPEG"]:
      return None

    size = (x, y)

    if (img.size[0] < x):
      x = img.size[0]
    if (img.size[1] < y):
      y = img.size[1]

    img_ratio = float(img.size[0]) / img.size[1]

    # resize but constrain proportions?
    if x == 0.0:
      x = y * img_ratio
    elif y == 0.0:
      y = x / img_ratio

    thumb_ratio = float(x) / y
    x = int(x); y = int(y)

    if(img_ratio > thumb_ratio):
      c_width = int(x * img.size[1] / y)
      c_height = img.size[1]
      origin_x = int(img.size[0] / 2 - c_width / 2)
      origin_y = 0
    else:
      c_width = img.size[0]
      c_height = int(y * img.size[0] / x)
      origin_x = 0
      origin_y = int(img.size[1] / 2 - c_height / 2)

    crop_box = (origin_x, origin_y, origin_x + c_width, origin_y + c_height)
    img = img.crop(crop_box)
    img.thumbnail([x, y], Image.ANTIALIAS)

    if img.mode != "RGB":
      img = img.convert("RGB")

    img.thumbnail(size, Image.ANTIALIAS)
    
    if img_format == "GIF":
      img = img.convert("P", dither=Image.NONE, palette=Image.ADAPTIVE)

    img.save(output, img_format, quality=93)
    filedata = output.getvalue()
    return filedata
  except (IOError, IndexError, SyntaxError):
    return False
  finally:
    img_fp.close()
    output.close()

if __name__ == "__main__":
  filedata = open('tests/A8OJKWH1.jpg').read()
  out = crop(filedata, 60, 60)
  open("test_crop.jpg", 'w').write(out)
#  filedata = open('tests/809.jpg')
#  out = StringIO()
#  img = Image.open(filedata)
#  resize_2(img, (130, 100), True, out)
#  out.seek(0)
#  open('test_resize.jpg', 'w').write(out.read())
